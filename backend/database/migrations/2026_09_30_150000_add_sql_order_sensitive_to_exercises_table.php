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
            // SQL-feladatnal szamit-e a sorok sorrendje (pl. "ORDER BY-jal rendezd").
            $table->boolean('sql_order_sensitive')->default(false)->after('starter_code');
        });
    }

    public function down(): void
    {
        Schema::table('exercises', function (Blueprint $table): void {
            $table->dropColumn('sql_order_sensitive');
        });
    }
};
