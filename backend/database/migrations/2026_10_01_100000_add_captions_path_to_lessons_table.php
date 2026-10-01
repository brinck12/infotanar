<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A lecke videojanak felirata (#111): WebVTT fajl a privat video-taroloban,
 * a videoval azonos hozzaferesi szabalyokkal es lejaro URL-lel.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lessons', function (Blueprint $table): void {
            $table->string('captions_path', 500)->nullable()->after('video_path');
        });
    }

    public function down(): void
    {
        Schema::table('lessons', function (Blueprint $table): void {
            $table->dropColumn('captions_path');
        });
    }
};
