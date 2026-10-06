<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Megujitasi ujraprobalkozasok (#138): egy idoszakra tobb terhelesi kiserlet
 * is lehet, ezert az egyediseg (elofizetes, idoszak)-rol (elofizetes,
 * idoszak, kiserlet)-re valt. Egy kiserlethez tovabbra is egyetlen
 * fizetes-sor tartozhat, igy a dupla terheles elleni vedelem megmarad.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table): void {
            $table->unsignedTinyInteger('attempt')->default(1)->after('renews_period_ending_at');

            // Az uj index kerul fel elobb: MySQL-en a subscription_id idegen kulcsa a
            // regi indexre tamaszkodik, es csak akkor dobhato el, ha mar van masik.
            $table->unique(['subscription_id', 'renews_period_ending_at', 'attempt'], 'payments_renewal_attempt_unique');
            $table->dropUnique(['subscription_id', 'renews_period_ending_at']);
        });
    }

    /**
     * Ha mar letezik ujraprobalkozas (attempt > 1), a regi egyedi index nem
     * allithato vissza, es a visszagorgetes hibaval megall. Ez szandekos: a
     * visszalepes fizetes-sorok torlese nelkul nem lehetseges.
     */
    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table): void {
            $table->unique(['subscription_id', 'renews_period_ending_at']);
            $table->dropUnique('payments_renewal_attempt_unique');
            $table->dropColumn('attempt');
        });
    }
};
