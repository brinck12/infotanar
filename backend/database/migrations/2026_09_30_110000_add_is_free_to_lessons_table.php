<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Freemium (#22): leckenkenti is_free jelolo. A meglevo track-ekben az elso
 * ket lecke (modul, majd lecke sorrendben) ingyenes lesz. A logika szandekosan
 * itt is szerepel (nem az alkalmazas-kodbol hivjuk), hogy a migracio kesobbi
 * kodvaltozasoktol fuggetlenul ugyanazt csinalja.
 */
return new class extends Migration
{
    private const FREE_LESSONS_PER_TRACK = 2;

    public function up(): void
    {
        Schema::table('lessons', function (Blueprint $table): void {
            $table->boolean('is_free')->default(false)->after('position');
        });

        foreach (DB::table('tracks')->pluck('id') as $trackId) {
            $freeLessonIds = DB::table('lessons')
                ->join('modules', 'modules.id', '=', 'lessons.module_id')
                ->where('modules.track_id', $trackId)
                ->orderBy('modules.position')
                ->orderBy('lessons.position')
                ->orderBy('lessons.id')
                ->limit(self::FREE_LESSONS_PER_TRACK)
                ->pluck('lessons.id');

            DB::table('lessons')->whereIn('id', $freeLessonIds)->update(['is_free' => true]);
        }
    }

    public function down(): void
    {
        Schema::table('lessons', function (Blueprint $table): void {
            $table->dropColumn('is_free');
        });
    }
};
