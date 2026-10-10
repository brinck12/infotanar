<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Tipusos feladatok: a feladat tovabbra is `exercises` sor (azonosito, lecke,
 * sorrend, publikalas, freemium es haladas valtozatlan), csak fajtat kap.
 *
 *  - `kind`: App\Enums\ExerciseKind erteke. Szoveges oszlop alkalmazas-szintu
 *    enummal, nem adatbazis-enum: uj ertekhez igy nem kell tablat ujraepiteni.
 *  - `spec`: a fajtahoz tartozo adatok (lepesek, elfogadott kiterjesztesek,
 *    webes fajlok, reszfeladatok...). Egy oszlop, mert minden fajta pontosan
 *    egy alakot hasznal.
 *  - `comparison`: a kimenet osszehasonlitasanak modja; NULL = a mai, soronkenti.
 */
return new class extends Migration
{
    private const KIND_INDEX = 'exercises_kind_index';

    public function up(): void
    {
        Schema::table('exercises', function (Blueprint $table): void {
            $table->string('kind', 24)->default('code')->after('position');
            $table->json('spec')->nullable()->after('constraints');
            $table->json('comparison')->nullable()->after('spec');

            $table->index('kind', self::KIND_INDEX);
        });

        $this->backfillSqlKind();
    }

    public function down(): void
    {
        // Ket lepesben: SQLite-on indexelt oszlop nem dobhato el.
        Schema::table('exercises', function (Blueprint $table): void {
            $table->dropIndex(self::KIND_INDEX);
        });

        Schema::table('exercises', function (Blueprint $table): void {
            $table->dropColumn(['kind', 'spec', 'comparison']);
        });
    }

    /**
     * A meglevo SQL-feladatok (`allowed_languages` pontosan ["sql"]) `sql`
     * fajtat kapnak, minden mas `code` marad (az oszlop alaperteke).
     *
     * PHP-ban dontunk, nem JSON-fuggvennyel az SQL-ben, igy MySQL-en es
     * SQLite-on biztosan ugyanaz az eredmeny.
     */
    private function backfillSqlKind(): void
    {
        DB::table('exercises')
            ->select(['id', 'allowed_languages'])
            ->orderBy('id')
            ->chunkById(200, static function (Collection $exercises): void {
                $sqlIds = [];

                foreach ($exercises as $exercise) {
                    $languages = is_string($exercise->allowed_languages)
                        ? json_decode($exercise->allowed_languages, true)
                        : null;

                    if ($languages === ['sql']) {
                        $sqlIds[] = $exercise->id;
                    }
                }

                if ($sqlIds !== []) {
                    DB::table('exercises')->whereIn('id', $sqlIds)->update(['kind' => 'sql']);
                }
            });
    }
};
