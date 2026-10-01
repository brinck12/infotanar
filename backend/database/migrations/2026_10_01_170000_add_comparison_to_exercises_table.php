<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('exercises', function (Blueprint $table): void {
            // Kimenet-osszevetes beallitasai (#155), lasd ComparisonSettings. NULL = "exact":
            // a korabbi, soronkenti osszevetes, ezert a meglevo feladatok nem valtoznak.
            $table->json('comparison')->nullable()->after('constraints');
        });
    }

    public function down(): void
    {
        Schema::table('exercises', function (Blueprint $table): void {
            $table->dropColumn('comparison');
        });
    }
};
