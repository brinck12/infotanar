<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Egy fajlfeladat ertekelolapja: pontonkent mit vizsgalunk, mennyit er, es
 * automatikus vagy kezi-e. A sorrend (`position`) mindig 0..n-1.
 *
 * A beadasok eredmenye pillanatkep (file_submissions.result), ezert egy pont
 * szerkesztese vagy torlese a korabbi eredmenyeket nem irja at.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rubric_items', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('exercise_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('position');
            // A lapon savkent megjeleno csoport; az ures csoport "Egyéb"-kent latszik.
            $table->string('group', 100)->default('');
            $table->string('label', 255);
            // App\Enums\RubricCheckType.
            $table->string('check_type', 32);
            // Mit vizsgalunk es mi az elvart ertek; a nyelvtant a tipus kezeloje adja.
            $table->string('property', 150)->default('');
            $table->string('expected', 500)->default('');
            $table->unsignedSmallInteger('points');
            // App\Enums\RubricMode: auto vagy manual.
            $table->string('mode', 8)->default('auto');
            $table->string('hint', 500)->nullable();
            // Strukturalt bovites importokhoz es kesobbi feluletekhez; a mai urlap nem kuldi.
            $table->json('params')->nullable();
            $table->timestamps();

            $table->index(['exercise_id', 'position']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rubric_items');
    }
};
