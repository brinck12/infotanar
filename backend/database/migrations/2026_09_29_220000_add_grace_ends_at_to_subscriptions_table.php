<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('subscriptions', function (Blueprint $table): void {
            $table->timestamp('grace_ends_at')->nullable()->after('cancel_at_period_end');
            $table->index(['status', 'grace_ends_at']);
        });
    }

    public function down(): void
    {
        Schema::table('subscriptions', function (Blueprint $table): void {
            $table->dropIndex(['status', 'grace_ends_at']);
            $table->dropColumn('grace_ends_at');
        });
    }
};
