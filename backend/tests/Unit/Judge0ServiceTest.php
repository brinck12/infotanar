<?php

namespace Tests\Unit;

use App\Exceptions\Judge0Exception;
use App\Services\Judge0Service;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class Judge0ServiceTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Cache::flush();
        config()->set('judge0.url', 'http://judge0.test');
        config()->set('judge0.auth_token', 'teszt-token');
    }

    public function test_a_nyelv_id_jet_futasidoben_oldja_fel_a_languages_vegpontrol(): void
    {
        Http::fake([
            'judge0.test/languages' => Http::response([
                ['id' => 100, 'name' => 'Python (3.11.2)'],
                ['id' => 51, 'name' => 'C# (Mono 6.6.0.161)'],
            ]),
        ]);

        $service = new Judge0Service();

        // 100, nem a configban levo 71-es tartalek: a futasideju feloldas nyert.
        $this->assertSame(100, $service->resolveLanguageId('python'));
        $this->assertSame(51, $service->resolveLanguageId('csharp'));
    }

    public function test_a_tartalek_id_t_hasznalja_ha_a_languages_nem_erheto_el(): void
    {
        Http::fake([
            'judge0.test/languages' => Http::response(status: 500),
        ]);

        $service = new Judge0Service();

        $this->assertSame(config('judge0.languages.python.fallback_id'), $service->resolveLanguageId('python'));
    }

    public function test_ismeretlen_nyelvre_kivetelt_dob(): void
    {
        Http::fake();

        $this->expectException(Judge0Exception::class);

        (new Judge0Service())->resolveLanguageId('brainfuck');
    }

    public function test_a_forraskodot_es_a_bemenetet_base64_ban_kuldi_a_limitekkel(): void
    {
        Http::fake([
            'judge0.test/languages' => Http::response([['id' => 71, 'name' => 'Python (3.8.1)']]),
            'judge0.test/submissions*' => Http::response([
                'stdout' => base64_encode("42\n"),
                'stderr' => null,
                'compile_output' => null,
                'time' => '0.01',
                'memory' => 3000,
                'exit_code' => 0,
                'status' => ['id' => 3, 'description' => 'Accepted'],
            ]),
        ]);

        $result = (new Judge0Service())->run('python', 'print(42)', '7');

        $this->assertSame("42\n", $result['stdout']);
        $this->assertSame('Accepted', $result['status']);
        $this->assertSame(3, $result['status_id']);

        Http::assertSent(function ($request) {
            if (! str_contains($request->url(), '/submissions')) {
                return false;
            }

            return $request['source_code'] === base64_encode('print(42)')
                && $request['stdin'] === base64_encode('7')
                && $request['language_id'] === 71
                && $request['cpu_time_limit'] === 2.0
                && $request['memory_limit'] === 128000
                && $request['max_processes_and_or_threads'] === 60
                && $request->hasHeader('X-Auth-Token', 'teszt-token');
        });
    }

    public function test_hibas_valasz_eseten_kivetelt_dob_magyar_uzenettel(): void
    {
        Http::fake([
            'judge0.test/languages' => Http::response([['id' => 71, 'name' => 'Python (3.8.1)']]),
            'judge0.test/submissions*' => Http::response(status: 503),
        ]);

        $this->expectException(Judge0Exception::class);
        $this->expectExceptionMessage('A kódfuttató szolgáltatás hibával válaszolt');

        (new Judge0Service())->run('python', 'print(1)');
    }
}
