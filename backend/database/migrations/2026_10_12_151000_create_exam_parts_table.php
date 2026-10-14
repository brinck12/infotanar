<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Egy vizsga reszei. Minden resz egy feladatra mutat, amely a szoveget, a
 * forrasfajlokat es az ertekelolapot (fajlos resz) vagy a teszteseteket
 * (szerkesztos resz) hordozza.
 *
 * Reszhez hasznalt feladat torleset az alkalmazas megtagadja; a nullOnDelete
 * csak vedohalo, hogy a vizsga szerkezete akkor se torlodjon.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exam_parts', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('exam_id')->constrained()->cascadeOnDelete();
            $table->foreignId('exercise_id')->nullable()->constrained()->nullOnDelete();
            // 0..n-1; az API-ban `order = position + 1`.
            $table->unsignedSmallInteger('position');
            // App\Enums\ExamPartKey.
            $table->string('key', 16);
            $table->string('name', 255);
            // Ennyi vizsgapontot er a resz az osszpontszambol.
            $table->unsignedSmallInteger('points');
            // Csak ajanlott ido, nem korlat.
            $table->unsignedSmallInteger('minutes');
            $table->timestamps();

            $table->index(['exam_id', 'position']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exam_parts');
    }
};
