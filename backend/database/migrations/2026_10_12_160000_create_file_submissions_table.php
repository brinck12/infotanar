<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Egy feltoltott fajl es az ertekelese. Gyakorlo fajlfeladatnal es
 * vizsgaresznel is ez a sor keletkezik; a vizsgaban feltoltott sorok
 * (`exam_attempt_id` kitoltve) kimaradnak a gyakorlo listakbol es a haladasbol.
 *
 * A fajl a privat `submission_files` tarolon van. A `result` pillanatkep,
 * igy a regi eredmenyek az ertekelolap valtozasa utan is olvashatok.
 *
 * A fiok torlesekor a sorokat es a fajlokat egy listener torli (a
 * felhasznalok csak soft delete-et kapnak); a nullOnDelete csak vedohalo.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('file_submissions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('exercise_id')->constrained()->cascadeOnDelete();
            $table->foreignId('exam_attempt_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('exam_part_id')->nullable()->constrained()->nullOnDelete();
            // Gyakorlasnal futo sorszam felhasznalonkent es feladatonkent; vizsgasornal 1.
            $table->unsignedSmallInteger('attempt')->default(1);
            // App\Enums\FileSubmissionStatus.
            $table->string('status', 12)->default('stored');
            // Megtisztitott megjelenitesi nev; utvonal soha nem keszul belole.
            $table->string('original_name', 255);
            $table->string('path', 255);
            // Kisbetus, ponttal: pl. ".xlsx".
            $table->string('extension', 8);
            $table->unsignedInteger('size');
            $table->char('sha256', 64);
            // Nyers pont: az automatikus pontok es a megjelolt kezi pontok osszege.
            $table->unsignedSmallInteger('score')->default(0);
            // Az ertekelolap osszpontszama az ertekeles pillanataban.
            $table->unsignedSmallInteger('max_score')->default(0);
            $table->boolean('passed')->default(false);
            // {groups: [...], items: [...], facts: [...]}.
            $table->json('result')->nullable();
            // Magyar ok, ha a feldolgozas nem sikerult.
            $table->string('error', 500)->nullable();
            $table->timestamp('evaluated_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'exercise_id', 'id'], 'file_submissions_user_exercise_index');
            // A haladas unioja (megoldott / megkiserelt feladatok).
            $table->index(['user_id', 'exercise_id', 'exam_attempt_id', 'passed'], 'file_submissions_progress_index');
            // Vizsgareszenkent egy feltoltes; a gyakorlo sorokat (NULL, NULL) nem erinti.
            $table->unique(['exam_attempt_id', 'exam_part_id'], 'file_submissions_attempt_part_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('file_submissions');
    }
};
