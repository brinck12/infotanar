<?php

namespace Tests\Feature;

use App\Models\Submission;
use App\Models\Task;
use App\Models\Topic;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class ApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config()->set('judge0.url', 'http://judge0.test');
    }

    private function makeTask(bool $published = true): Task
    {
        $topic = Topic::create(['name' => 'Programozási tételek', 'slug' => 'programozasi-tetelek']);

        $task = Task::create([
            'topic_id' => $topic->id,
            'title' => 'Összegzés tétele',
            'description' => 'Add össze a számokat.',
            'level' => 'kozep',
            'difficulty' => 1,
            'allowed_languages' => ['python'],
            'starter_code' => ['python' => "print()\n"],
            'is_published' => $published,
        ]);

        $task->testCases()->create([
            'stdin' => "1\n", 'expected_stdout' => "1\n", 'is_hidden' => false, 'order' => 0,
        ]);
        $task->testCases()->create([
            'stdin' => "2\n", 'expected_stdout' => "2\n", 'is_hidden' => true, 'order' => 1,
        ]);

        return $task;
    }

    /** A Judge0 mindig az elvart kimenetet adja vissza -> minden teszt atmegy. */
    private function fakeJudge0Echo(): void
    {
        Http::fake([
            'judge0.test/languages' => Http::response([['id' => 71, 'name' => 'Python (3.8.1)']]),
            'judge0.test/submissions*' => function ($request) {
                $stdin = base64_decode((string) $request['stdin']);

                return Http::response([
                    'stdout' => base64_encode($stdin),
                    'stderr' => null,
                    'compile_output' => null,
                    'time' => '0.01',
                    'memory' => 3000,
                    'exit_code' => 0,
                    'status' => ['id' => 3, 'description' => 'Accepted'],
                ]);
            },
        ]);
    }

    public function test_health_vegpont(): void
    {
        $this->getJson('/api/v1/health')
            ->assertOk()
            ->assertExactJson(['ok' => true]);
    }

    public function test_topics_vegpont_a_publikalt_feladatokat_szamolja(): void
    {
        $this->makeTask();

        $this->getJson('/api/v1/topics')
            ->assertOk()
            ->assertJsonPath('data.0.slug', 'programozasi-tetelek')
            ->assertJsonPath('data.0.task_count', 1);
    }

    public function test_tasks_lista_nem_adja_vissza_a_leirast(): void
    {
        $this->makeTask();

        $response = $this->getJson('/api/v1/tasks')->assertOk();

        $this->assertCount(1, $response->json('data'));
        $this->assertArrayNotHasKey('description', $response->json('data.0'));
    }

    public function test_tasks_lista_szint_szerint_szurheto(): void
    {
        $this->makeTask();

        $this->getJson('/api/v1/tasks?level=emelt')->assertOk()->assertJsonCount(0, 'data');
        $this->getJson('/api/v1/tasks?level=kozep')->assertOk()->assertJsonCount(1, 'data');
    }

    public function test_nem_publikalt_feladat_nem_jelenik_meg(): void
    {
        $task = $this->makeTask(published: false);

        $this->getJson('/api/v1/tasks')->assertOk()->assertJsonCount(0, 'data');
        $this->getJson("/api/v1/tasks/{$task->id}")->assertNotFound();
    }

    public function test_task_reszletek_csak_a_nem_rejtett_teszteseteket_adjak_vissza(): void
    {
        $task = $this->makeTask();

        $this->getJson("/api/v1/tasks/{$task->id}")
            ->assertOk()
            ->assertJsonCount(1, 'data.example_test_cases')
            ->assertJsonPath('data.hidden_test_case_count', 1)
            ->assertJsonPath('data.starter_code.python', "print()\n");
    }

    public function test_run_csak_a_nem_rejtett_teszteseteken_fut(): void
    {
        $this->fakeJudge0Echo();
        $task = $this->makeTask();

        $response = $this->postJson('/api/v1/run', [
            'task_id' => $task->id,
            'language' => 'python',
            'source_code' => 'print(input())',
        ])->assertOk();

        $this->assertSame('passed', $response->json('status'));
        $this->assertCount(1, $response->json('results'));
        $this->assertFalse($response->json('results.0.hidden'));
    }

    public function test_run_nem_ment_submissiont(): void
    {
        $this->fakeJudge0Echo();
        $task = $this->makeTask();

        $this->postJson('/api/v1/run', [
            'task_id' => $task->id,
            'language' => 'python',
            'source_code' => 'print(input())',
        ])->assertOk();

        $this->assertSame(0, Submission::count());
    }

    public function test_submission_minden_teszteseten_fut_es_mentodik(): void
    {
        $this->fakeJudge0Echo();
        $task = $this->makeTask();

        $response = $this->postJson('/api/v1/submissions', [
            'task_id' => $task->id,
            'language' => 'python',
            'source_code' => 'print(input())',
        ])->assertOk();

        $this->assertSame('passed', $response->json('status'));
        $this->assertCount(2, $response->json('results'));

        $submission = Submission::firstOrFail();
        $this->assertSame('passed', $submission->status);
        $this->assertCount(2, $submission->results);
    }

    public function test_rejtett_teszteset_kimenete_nem_szivarog_ki(): void
    {
        $this->fakeJudge0Echo();
        $task = $this->makeTask();

        $response = $this->postJson('/api/v1/submissions', [
            'task_id' => $task->id,
            'language' => 'python',
            'source_code' => 'print(input())',
        ])->assertOk();

        $hidden = collect($response->json('results'))->firstWhere('hidden', true);

        $this->assertArrayNotHasKey('stdout', $hidden);
        $this->assertArrayNotHasKey('expected', $hidden);
        $this->assertArrayNotHasKey('stdin', $hidden);
    }

    public function test_rossz_kimenet_eseten_failed(): void
    {
        Http::fake([
            'judge0.test/languages' => Http::response([['id' => 71, 'name' => 'Python (3.8.1)']]),
            'judge0.test/submissions*' => Http::response([
                'stdout' => base64_encode("rossz\n"),
                'status' => ['id' => 3, 'description' => 'Accepted'],
                'time' => '0.01',
                'exit_code' => 0,
            ]),
        ]);

        $task = $this->makeTask();

        $this->postJson('/api/v1/submissions', [
            'task_id' => $task->id,
            'language' => 'python',
            'source_code' => 'print("rossz")',
        ])->assertOk()->assertJsonPath('status', 'failed');
    }

    public function test_elerhetetlen_judge0_eseten_magyar_hibauzenet_jon_nem_stacktrace(): void
    {
        Http::fake([
            'judge0.test/languages' => Http::response([['id' => 71, 'name' => 'Python (3.8.1)']]),
            'judge0.test/submissions*' => Http::response(status: 503),
        ]);

        $task = $this->makeTask();

        $response = $this->postJson('/api/v1/run', [
            'task_id' => $task->id,
            'language' => 'python',
            'source_code' => 'print(1)',
        ])->assertOk();

        $this->assertSame('error', $response->json('status'));
        $this->assertStringContainsString('kódfuttató', $response->json('results.0.error'));
    }

    public function test_nem_tamogatott_nyelv_validacios_hiba(): void
    {
        $task = $this->makeTask();

        $this->postJson('/api/v1/run', [
            'task_id' => $task->id,
            'language' => 'brainfuck',
            'source_code' => 'x',
        ])->assertStatus(422)->assertJsonValidationErrors('language');
    }

    public function test_a_feladat_altal_nem_engedett_nyelv_elutasitva(): void
    {
        $task = $this->makeTask();
        $task->update(['allowed_languages' => ['csharp']]);

        $this->postJson('/api/v1/run', [
            'task_id' => $task->id,
            'language' => 'python',
            'source_code' => 'print(1)',
        ])->assertStatus(422)->assertJsonValidationErrors('language');
    }

    public function test_ures_forraskod_validacios_hiba(): void
    {
        $task = $this->makeTask();

        $this->postJson('/api/v1/run', [
            'task_id' => $task->id,
            'language' => 'python',
            'source_code' => '',
        ])->assertStatus(422)->assertJsonValidationErrors('source_code');
    }

    public function test_a_futtatas_rate_limitelt(): void
    {
        $this->fakeJudge0Echo();
        $task = $this->makeTask();

        $payload = [
            'task_id' => $task->id,
            'language' => 'python',
            'source_code' => 'print(input())',
        ];

        for ($i = 0; $i < 10; $i++) {
            $this->postJson('/api/v1/run', $payload)->assertOk();
        }

        $this->postJson('/api/v1/run', $payload)->assertStatus(429);
    }
}
