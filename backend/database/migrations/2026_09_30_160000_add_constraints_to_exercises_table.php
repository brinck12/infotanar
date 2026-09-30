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
            // App\Services\Constraints\ConstraintSet: {"require": [...], "forbid": [...]}; NULL = nincs szabaly.
            $table->json('constraints')->nullable()->after('starter_code');
        });
    }

    public function down(): void
    {
        Schema::table('exercises', function (Blueprint $table): void {
            $table->dropColumn('constraints');
        });
    }
};
