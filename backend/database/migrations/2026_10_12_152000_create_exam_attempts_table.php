<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Egy diak probalkozasa egy vizsgan.
 *
 * Felhasznalonkent es vizsgankent legfeljebb egy nyitott probalkozas lehet.
 * Ezt az `in_progress_marker` egyedi indexe garantalja: nyitott sornal true,
 * kulonben NULL, es a NULL-ok egyik motorban sem utkoznek. Igy a szabaly
 * SQLite-on is el, ahol a lockForUpdate nem zarol.
 *
 * A felhasznalok csak soft delete-et kapnak, ezert a fiok torlesekor a
 * sorokat egy listener torli; a cascade csak vedohalo.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exam_attempts', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('exam_id')->constrained()->cascadeOnDelete();
            // App\Enums\ExamMode: exam vagy practice.
            $table->string('mode', 8);
            // App\Enums\ExamAttemptState.
            $table->string('state', 12)->default('in_progress');
            $table->boolean('in_progress_marker')->nullable();
            $table->timestamp('started_at');
            // Vizsgahelyzetben kezdes + a vizsga hossza (masolat: a vizsga kesobbi
            // szerkesztese nem mozditja el a futo hataridot); gyakorlasnal NULL.
            $table->timestamp('deadline_at')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('evaluated_at')->nullable();
            // Feltoltes es olvasas frissiti; a tetlen gyakorlasok takaritasa ebbol dolgozik.
            $table->timestamp('last_activity_at');
            // Vizsgapont az atvaltas utan; az ertekelesig NULL.
            $table->unsignedSmallInteger('score')->nullable();
            $table->unsignedSmallInteger('max_score')->nullable();
            $table->unsignedSmallInteger('pending_manual_points')->default(0);
            // Reszenkenti pillanatkep: [{part_id, order, score, max_score, raw_score, raw_max,
            // summary, file_submission_id, submission_id}].
            $table->json('result')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'exam_id', 'in_progress_marker']);
            // A lejart probalkozasokat lezaro job.
            $table->index(['state', 'deadline_at']);
            // A diak legutobbi probalkozasa vizsgankent.
            $table->index(['user_id', 'exam_id', 'id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exam_attempts');
    }
};
