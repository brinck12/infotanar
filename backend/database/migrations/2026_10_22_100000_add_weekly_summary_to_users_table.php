<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Heti osszefoglalo e-mail (opt-in): alapbol kikapcsolt. A `weekly_summary_sent_at` a
 * kuldes lefoglalasa, hogy ketszeri futasnal is egy level menjen hetente.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->boolean('weekly_summary_opt_in')->default(false);
            $table->timestamp('weekly_summary_sent_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropColumn(['weekly_summary_opt_in', 'weekly_summary_sent_at']);
        });
    }
};
