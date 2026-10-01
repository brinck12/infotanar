<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * A feladathoz mellekelt adatfajlok (#152), amelyeket a megoldas futas
     * kozben nev szerint megnyithat (pl. open("adatok.txt")).
     *
     * - test_case_id = NULL: kozos fajl, minden tesztesetnel jelen van, es a
     *   diak letoltheti.
     * - test_case_id kitoltve: csak annal a tesztesetnel van jelen, es az
     *   azonos nevu kozos fajl helyere lep. A diak soha nem kapja meg.
     */
    public function up(): void
    {
        Schema::create('exercise_files', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('exercise_id')->constrained()->cascadeOnDelete();
            $table->foreignId('test_case_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('name', 64);
            // Base64: a fajl tetszoleges bajtsorozat lehet (pl. Latin-2 kodolasu
            // szoveg), amit egy utf8mb4 szovegoszlop nem tarolhatna valtozatlanul.
            $table->longText('content');
            $table->unsignedInteger('size');
            $table->char('sha256', 64);
            $table->timestamps();

            // Az egyediseget a ManageExerciseFile ellenorzi: a NULL test_case_id
            // miatt egy egyedi index a kozos fajlokat nem vedene.
            $table->index(['exercise_id', 'test_case_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exercise_files');
    }
};
