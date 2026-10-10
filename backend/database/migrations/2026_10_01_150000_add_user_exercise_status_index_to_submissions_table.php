<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A feladatlistak a nezo beadasait feladatonkent osszesitik (#146): az index
 * miatt ehhez nem kell a beadasok sorait (a forraskoddal) beolvasni.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('submissions', function (Blueprint $table) {
            $table->index(['user_id', 'exercise_id', 'status'], 'submissions_user_exercise_status_index');
        });
    }

    public function down(): void
    {
        // MySQL az osszetett index letrejottekor eldobja a user_id idegen kulcs sajat, automatikus
        // indexet, mert az uj index is kiszolgalja. Visszagorgeteskor ezert elobb vissza kell adni
        // egyet, kulonben a torles megall: "needed in a foreign key constraint" (1553).
        $restoreForeignKeyIndex = in_array(Schema::getConnection()->getDriverName(), ['mysql', 'mariadb'], true)
            && ! Schema::hasIndex('submissions', 'submissions_user_id_foreign');

        Schema::table('submissions', function (Blueprint $table) use ($restoreForeignKeyIndex) {
            if ($restoreForeignKeyIndex) {
                $table->index('user_id', 'submissions_user_id_foreign');
            }

            $table->dropIndex('submissions_user_exercise_status_index');
        });
    }
};
