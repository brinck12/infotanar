<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Reszpontszam a kodbeadasokon: reszfeladatos feladatnal a megszerzett es az
 * elerheto pont, kulonben a teljesult es a lefutott tesztesetek szama.
 *
 * A regi sorok NULL-ok maradnak: az olvaso (pl. a vizsgapontozas) ilyenkor a
 * `results[].passed` ertekeibol szamol. Uj index nem kell, a
 * submissions_user_exercise_status_index kiszolgalja a lekerdezeseket.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('submissions', function (Blueprint $table): void {
            $table->unsignedSmallInteger('score')->nullable()->after('results');
            $table->unsignedSmallInteger('max_score')->nullable()->after('score');
            // Reszfeladatonkent {label, points, max_points, passed}; vart vagy kapott szoveg nelkul.
            $table->json('subtasks')->nullable()->after('max_score');
        });
    }

    public function down(): void
    {
        Schema::table('submissions', function (Blueprint $table): void {
            $table->dropColumn(['score', 'max_score', 'subtasks']);
        });
    }
};
