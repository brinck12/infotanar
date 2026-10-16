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
            // Nyelvenkenti mintamegoldas ({"python": "..."}); csak admin latja, diaknak soha nem megy ki. NULL = nincs.
            $table->json('sample_solutions')->nullable()->after('starter_code');
        });
    }

    public function down(): void
    {
        Schema::table('exercises', function (Blueprint $table): void {
            $table->dropColumn('sample_solutions');
        });
    }
};
