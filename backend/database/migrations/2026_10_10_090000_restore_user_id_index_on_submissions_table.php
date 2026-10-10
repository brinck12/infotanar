<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A `submissions.user_id` idegen kulcs sajat indexe MySQL-en.
 *
 * Az osszetett (user_id, exercise_id, status) index letrejottekor a MySQL
 * eldobta az idegen kulcs automatikus indexet, mert az uj index is kiszolgalja.
 * Emiatt az osszetett indexet bevezeto migracio nem volt visszagorgetheto:
 * a torlese megallt ("needed in a foreign key constraint", 1553). Kiadott
 * migraciot nem modositunk, ezert az indexet ez a migracio adja vissza.
 */
return new class extends Migration
{
    private const INDEX = 'submissions_user_id_foreign';

    public function up(): void
    {
        // SQLite-on az idegen kulcsnak nincs sajat indexe, ott nincs mit helyreallitani.
        if (! in_array(Schema::getConnection()->getDriverName(), ['mysql', 'mariadb'], true)) {
            return;
        }

        if (Schema::hasIndex('submissions', self::INDEX)) {
            return;
        }

        Schema::table('submissions', function (Blueprint $table): void {
            $table->index('user_id', self::INDEX);
        });
    }

    /**
     * Szandekosan ures. Az index a tabla eredeti allapotahoz tartozik: ha itt
     * eldobnank, az osszetett index visszagorgetese ujra megallna.
     */
    public function down(): void {}
};
