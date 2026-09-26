<?php

namespace Tests\Unit;

use App\Services\Judge0Service;
use App\Services\TaskEvaluator;
use Tests\TestCase;

class TaskEvaluatorTest extends TestCase
{
    private function evaluator(): TaskEvaluator
    {
        return new TaskEvaluator($this->createMock(Judge0Service::class));
    }

    public function test_a_zaro_sortorest_nem_szamitja_eltaresnek(): void
    {
        $this->assertTrue($this->evaluator()->outputMatches("42\n", '42'));
        $this->assertTrue($this->evaluator()->outputMatches('42', "42\n\n"));
    }

    public function test_a_sorvegi_szokozoket_normalizalja(): void
    {
        $this->assertTrue($this->evaluator()->outputMatches("42   \n", "42\n"));
    }

    public function test_a_windows_soroveget_is_kezeli(): void
    {
        $this->assertTrue($this->evaluator()->outputMatches("1\r\n2\r\n", "1\n2\n"));
    }

    public function test_a_tenyleges_elteres_bukas(): void
    {
        $this->assertFalse($this->evaluator()->outputMatches("42\n", "43\n"));
        $this->assertFalse($this->evaluator()->outputMatches("1\n2\n", "2\n1\n"));
    }

    public function test_a_sorok_kozotti_ures_sor_szamit(): void
    {
        $this->assertFalse($this->evaluator()->outputMatches("1\n\n2\n", "1\n2\n"));
    }
}
