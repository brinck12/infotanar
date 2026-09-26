<?php

namespace App\Services;

use App\Exceptions\Judge0Exception;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Vekony kliens a sajat hosztolasu Judge0 peldanyhoz.
 *
 * A frontend soha nem hivja kozvetlenul a Judge0-t: a token nem kerulhet a
 * kliensbe, es az elvart kimenet osszevetese is itt, szerveroldalon tortenik.
 */
class Judge0Service
{
    /**
     * Egyetlen forraskod lefuttatasa egy adott bemenettel.
     *
     * @param  string  $languageKey  A config/judge0.php 'languages' kulcsa (pl. 'python').
     * @return array{stdout:string,stderr:string,compile_output:string,time:?float,memory:?int,exit_code:?int,status:string,status_id:int}
     *
     * @throws Judge0Exception
     */
    public function run(string $languageKey, string $sourceCode, ?string $stdin = null): array
    {
        $languageId = $this->resolveLanguageId($languageKey);

        $payload = array_merge(config('judge0.limits'), [
            'language_id' => $languageId,
            'source_code' => base64_encode($sourceCode),
            'stdin' => base64_encode((string) $stdin),
        ]);

        $response = $this->request()
            ->post('/submissions?base64_encoded=true&wait=true', $payload);

        if ($response->failed()) {
            throw new Judge0Exception(
                'A kódfuttató szolgáltatás hibával válaszolt (HTTP '.$response->status().').'
            );
        }

        $data = $response->json();

        if (! is_array($data) || ! isset($data['status']['id'])) {
            throw new Judge0Exception('A kódfuttató szolgáltatás értelmezhetetlen választ adott.');
        }

        return [
            'stdout' => $this->decode($data['stdout'] ?? null),
            'stderr' => $this->decode($data['stderr'] ?? null),
            'compile_output' => $this->decode($data['compile_output'] ?? null),
            'time' => isset($data['time']) ? (float) $data['time'] : null,
            'memory' => isset($data['memory']) ? (int) $data['memory'] : null,
            'exit_code' => $data['exit_code'] ?? null,
            'status' => (string) ($data['status']['description'] ?? 'Ismeretlen'),
            'status_id' => (int) $data['status']['id'],
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
        $config = config("judge0.languages.{$languageKey}");

        if (! $config) {
            throw new Judge0Exception("Nem támogatott programozási nyelv: {$languageKey}.");
        }

        $languages = $this->languages();

        foreach ($languages as $language) {
            $name = strtolower((string) ($language['name'] ?? ''));
            if ($name !== '' && str_contains($name, strtolower($config['match']))) {
                return (int) $language['id'];
            }
        }

        // A /languages nem elerheto vagy nem talaltuk a nyelvet: a configban
        // rogzitett tartalek ID-vel probalkozunk, hogy ne alljon meg a rendszer.
        Log::warning('Judge0: nyelv nem talalhato a /languages valaszban, tartalek ID hasznalata.', [
            'language' => $languageKey,
            'fallback_id' => $config['fallback_id'],
        ]);

        return (int) $config['fallback_id'];
    }

    /**
     * A Judge0 altal tamogatott nyelvek listaja, cache-elve.
     *
     * @return array<int, array{id:int,name:string}>
     */
    public function languages(): array
    {
        return Cache::remember(
            'judge0.languages',
            config('judge0.languages_cache_ttl'),
            function (): array {
                try {
                    $response = $this->request()->get('/languages');

                    return $response->successful() ? (array) $response->json() : [];
                } catch (Throwable $e) {
                    Log::warning('Judge0: a /languages lekerdezese sikertelen.', ['hiba' => $e->getMessage()]);

                    return [];
                }
            }
        );
    }

    /** Elerheto-e egyaltalan a Judge0 (a /health vegponthoz). */
    public function isReachable(): bool
    {
        try {
            return $this->request()->timeout(5)->get('/about')->successful();
        } catch (Throwable) {
            return false;
        }
    }

    private function request(): \Illuminate\Http\Client\PendingRequest
    {
        $request = Http::baseUrl(config('judge0.url'))
            ->timeout(config('judge0.timeout'))
            ->acceptJson();

        if ($token = config('judge0.auth_token')) {
            $request = $request->withHeaders(['X-Auth-Token' => $token]);
        }

        return $request;
    }

    private function decode(?string $value): string
    {
        if ($value === null || $value === '') {
            return '';
        }

        return (string) base64_decode($value, true);
    }
}
