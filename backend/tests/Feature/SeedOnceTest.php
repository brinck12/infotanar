<?php

namespace Tests\Feature;

use App\Models\Task;
use App\Models\Topic;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SeedOnceTest extends TestCase
{
    use RefreshDatabase;

    public function test_ures_adatbazison_betolti_a_mintaadatokat(): void
    {
        $this->assertSame(0, Task::count());

        $this->artisan('db:seed-once')
            ->expectsOutputToContain('Az adatbázis üres')
            ->assertSuccessful();

        $this->assertSame(5, Task::count());
        $this->assertGreaterThan(0, Topic::count());
    }

    public function test_masodszorra_nem_seedel_ujra(): void
    {
        $this->artisan('db:seed-once')->assertSuccessful();
        $elsoFutasUtan = Task::count();

        $this->artisan('db:seed-once')
            ->expectsOutputToContain('Kihagyva')
            ->assertSuccessful();

        $this->assertSame($elsoFutasUtan, Task::count());
    }

    public function test_nem_nyulja_felul_a_kezzel_szerkesztett_feladatot(): void
    {
        $this->artisan('db:seed-once')->assertSuccessful();

        $task = Task::firstOrFail();
        $task->update(['title' => 'Kézzel átírt cím']);

        $this->artisan('db:seed-once')->assertSuccessful();

        $this->assertSame('Kézzel átírt cím', $task->fresh()->title);
    }
}
