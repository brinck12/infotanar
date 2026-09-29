<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subscriptions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            // Fizetesi szolgaltato (#12 donti el); a manualisan adott hozzaferes 'manual'.
            $table->string('provider', 32);
            $table->string('provider_customer_id')->nullable();
            $table->string('provider_subscription_id')->nullable();

            $table->string('status', 16);
            $table->timestamp('current_period_start')->nullable();
            $table->timestamp('current_period_end')->nullable();
            $table->boolean('cancel_at_period_end')->default(false);
            $table->timestamp('canceled_at')->nullable();
            $table->timestamps();

            $table->unique(['provider', 'provider_subscription_id']);
            $table->index(['status', 'current_period_end']);

            // "Egy felhasznalonak egyszerre legfeljebb egy elo elofizetese lehet" -
            // adatbazis szinten kikenyszeritve. A generalt oszlop csak elo
            // (active/past_due) sornal tartalmazza a user_id-t; a lezart sorok
            // NULL-t kapnak, amire az egyedi index nem vonatkozik. MySQL 8-on
            // es SQLite-on is mukodik (nincs szukseg reszleges indexre).
            $table->unsignedBigInteger('live_user_id')
                ->nullable()
                ->storedAs("case when status in ('active', 'past_due') then user_id end")
                ->unique();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subscriptions');
    }
};
