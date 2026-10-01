<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** A szerzo altal irt segitseg egy feladathoz (#154): tippek es mintamegoldasok. */
    public function up(): void
    {
        Schema::create('exercise_hints', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('exercise_id')->constrained()->cascadeOnDelete();
            // 0..n-1, a SiblingOrder tartja karban; a diak ebben a sorrendben kapja a tippeket.
            $table->unsignedInteger('position');
            $table->text('body');
            $table->timestamps();

            $table->index(['exercise_id', 'position']);
        });

        Schema::create('exercise_solutions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('exercise_id')->constrained()->cascadeOnDelete();
            $table->string('language', 32);
            $table->text('source_code');
            $table->text('explanation')->nullable();
            $table->timestamps();

            $table->unique(['exercise_id', 'language']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exercise_solutions');
        Schema::dropIfExists('exercise_hints');
    }
};
