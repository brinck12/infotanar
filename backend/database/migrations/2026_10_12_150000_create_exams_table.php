<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Gyakorlo vizsga: egy hivatalos feladatsor (pl. 2026. majus, kozepszint),
 * rendezett reszekkel (exam_parts).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exams', function (Blueprint $table): void {
            $table->id();
            // Vizsgaidoszak: EEEE-05 vagy EEEE-10.
            $table->string('session', 7);
            $table->string('title', 255);
            $table->string('level', 8);
            // A vizsga hossza percben; vizsgahelyzetben a hatarido = kezdes + ennyi perc.
            $table->unsignedSmallInteger('minutes');
            $table->unsignedSmallInteger('points');
            $table->boolean('is_published')->default(false);
            // Engedelyezett-e a vizsgahelyzet (idozito, automatikus beadas).
            $table->boolean('timed_mode')->default(true);
            $table->timestamps();

            $table->index(['is_published', 'session', 'level'], 'exams_listing_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exams');
    }
};
