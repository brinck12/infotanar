<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Az admin attekintes (#160) idoszakra szur ezeken az oszlopokon; index nelkul a beadasok es
     * felhasznalok novekedesevel minden megnyitas vegigolvasna a tablat.
     */
    public function up(): void
    {
        Schema::table('submissions', function (Blueprint $table): void {
            $table->index('created_at');
        });

        Schema::table('users', function (Blueprint $table): void {
            $table->index(['role', 'created_at']);
        });

        Schema::table('payments', function (Blueprint $table): void {
            $table->index(['status', 'paid_at']);
            $table->index(['status', 'created_at']);
        });

        Schema::table('subscriptions', function (Blueprint $table): void {
            $table->index('created_at');
            $table->index(['status', 'canceled_at']);
        });
    }

    public function down(): void
    {
        Schema::table('submissions', function (Blueprint $table): void {
            $table->dropIndex(['created_at']);
        });

        Schema::table('users', function (Blueprint $table): void {
            $table->dropIndex(['role', 'created_at']);
        });

        Schema::table('payments', function (Blueprint $table): void {
            $table->dropIndex(['status', 'paid_at']);
            $table->dropIndex(['status', 'created_at']);
        });

        Schema::table('subscriptions', function (Blueprint $table): void {
            $table->dropIndex(['created_at']);
            $table->dropIndex(['status', 'canceled_at']);
        });
    }
};
