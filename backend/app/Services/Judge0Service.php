<?php

declare(strict_types=1);

namespace App\Services;

use App\Exceptions\Judge0Exception;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Vekony kliens a sajat hosztolasu Judge0 peldanyhoz.
 *
 * A frontend soha nem hivja kozvetlenul a Judge0-t: a token nem kerulhet a
 * kliensbe, es az elvart kimenet osszevetese is itt, szerveroldalon tortenik.
 *
 * @phpstan-type Judge0Run array{stdout: string, stderr: string, compile_output: string, time: ?float, memory: ?int, exit_code: ?int, status: string, status_id: int}
 */
final class Judge0Service
{
    /**
     * Egyetlen forraskod lefuttatasa egy adott bemenettel.
     *
     * @param  string  $languageKey  A config/judge0.php 'languages' kulcsa (pl. 'python').
     * @return Judge0Run
     *
     * @throws Judge0Exception
     */
    public function run(string $languageKey, string $sourceCode, ?string $stdin = null): array
    {
        $payload = [
            'cpu_time_limit' => Config::float('judge0.limits.cpu_time_limit'),
            'memory_limit' => Config::integer('judge0.limits.memory_limit'),
            'max_processes_and_or_threads' => Config::integer('judge0.limits.max_processes_and_or_threads'),
            'language_id' => $this->resolveLanguageId($languageKey),
            'source_code' => base64_encode($sourceCode),
            'stdin' => base64_encode((string) $stdin),
        ];

        try {
            $response = $this->request()->post('/submissions?base64_encoded=true&wait=true', $payload);
        } catch (ConnectionException $e) {
            // A nyers uzenet a belso Judge0 URL-t tartalmazza: csak a naploba kerul.
            Log::error('Judge0: submission request failed.', ['error' => $e->getMessage()]);

            throw Judge0Exception::unreachable($e);
        }

        if ($response->failed()) {
            Log::warning('Judge0: submission returned an error status.', ['status' => $response->status()]);

            throw Judge0Exception::httpError($response->status());
        }

        $data = $response->json();
        $status = is_array($data) ? ($data['status'] ?? null) : null;

        if (! is_array($data) || ! is_array($status) || ! is_numeric($status['id'] ?? null)) {
            throw Judge0Exception::malformedResponse();
        }

        return [
            'stdout' => $this->decode($data['stdout'] ?? null),
            'stderr' => $this->decode($data['stderr'] ?? null),
            'compile_output' => $this->decode($data['compile_output'] ?? null),
            // A Judge0 a time mezot stringkent kuldi (pl. "0.012").
            'time' => is_numeric($data['time'] ?? null) ? (float) $data['time'] : null,
            'memory' => is_numeric($data['memory'] ?? null) ? (int) $data['memory'] : null,
            'exit_code' => is_numeric($data['exit_code'] ?? null) ? (int) $data['exit_code'] : null,
            'status' => is_string($status['description'] ?? null) ? $status['description'] : 'Ismeretlen',
            'status_id' => (int) $status['id'],
        ];
    }

    /**
     * A nyelv Judge0 ID-janak feloldasa futasidoben a /languages vegpontrol.
     * A configban csak egy nev-reszlet van, nem beegetett ID.
     *
     * @throws Judge0Exception
     */
    public function resolveLanguageId(string $languageKey): int
    {
        /** @var array{match: string, fallback_id: int}|null $config */
        $config = config("judge0.languages.{$languageKey}");

        if ($config === null) {
            throw Judge0Exception::unsupportedLanguage($languageKey);
        }

        foreach ($this->languages() as $id => $name) {
            if (str_contains(strtolower($name), strtolower($config['match']))) {
                return $id;
            }
        }

        // A /languages nem elerheto vagy nem talaltuk a nyelvet: a configban
        // rogzitett tartalek ID-vel probalkozunk, hogy ne alljon meg a rendszer.
        Log::warning('Judge0: language not found in /languages response, using fallback id.', [
            'language' => $languageKey,
            'fallback_id' => $config['fallback_id'],
        ]);

        return (int) $config['fallback_id'];
    }

    /**
     * A Judge0 altal tamogatott nyelvek (id => nev), cache-elve.
     *
     * @return array<int, string>
     */
    public function languages(): array
    {
        // v2: id => nev alak; a regi (lista) alaku cache bejegyzesek igy nem olvasodnak vissza.
        return Cache::remember(
            'judge0.languages.v2',
            Config::integer('judge0.languages_cache_ttl'),
            function (): array {
                try {
                    $response = $this->request()->get('/languages');
                } catch (Throwable $e) {
                    Log::warning('Judge0: /languages request failed.', ['error' => $e->getMessage()]);

                    return [];
                }

                $languages = [];
                foreach ((array) ($response->successful() ? $response->json() : []) as $language) {
                    if (is_array($language) && is_int($language['id'] ?? null) && is_string($language['name'] ?? null)) {
                        $languages[$language['id']] = $language['name'];
                    }
                }

                return $languages;
            }
        );
    }

    /** Elerheto-e egyaltalan a Judge0. */
    public function isReachable(): bool
    {
        try {
            return $this->request()->timeout(5)->get('/about')->successful();
        } catch (Throwable) {
            return false;
        }
    }

    private function request(): PendingRequest
    {
        $request = Http::baseUrl(Config::string('judge0.url'))
            ->timeout(Config::integer('judge0.timeout'))
            ->acceptJson();

        $token = Config::get('judge0.auth_token');

        return is_string($token) && $token !== ''
            ? $request->withHeaders(['X-Auth-Token' => $token])
            : $request;
    }

    private function decode(mixed $value): string
    {
        if (! is_string($value) || $value === '') {
            return '';
        }

        return (string) base64_decode($value, true);
    }
}
