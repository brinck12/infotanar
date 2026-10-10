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
        Schema::table('submissions', function (Blueprint $table) {
            $table->dropIndex('submissions_user_exercise_status_index');
        });
    }
};
