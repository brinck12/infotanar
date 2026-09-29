<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lesson_completions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('lesson_id')->constrained()->cascadeOnDelete();
            $table->timestamp('completed_at');

            // Idempotencia adatbazis szinten: egy lecke egy felhasznalonal csak
            // egyszer teljesulhet, parhuzamos beadasok eseten is.
            $table->unique(['user_id', 'lesson_id']);
            $table->index('lesson_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lesson_completions');
    }
};
