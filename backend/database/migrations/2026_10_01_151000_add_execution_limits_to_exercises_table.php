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
            // Feladatonkenti korlatok (#151); NULL = a globalis alapertek ervenyes (config/judge0.php).
            $table->unsignedInteger('time_limit_ms')->nullable()->after('sql_order_sensitive');
            $table->unsignedInteger('memory_limit_kb')->nullable()->after('time_limit_ms');
        });
    }

    public function down(): void
    {
        Schema::table('exercises', function (Blueprint $table): void {
            $table->dropColumn(['time_limit_ms', 'memory_limit_kb']);
        });
    }
};
