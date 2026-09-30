<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Minden fizetesi kiserlet (elso fizetes + megujitasok) egy sora. A
 * szolgaltatoi allapotot a callback utan tukrozi (#15), es erre epul a
 * szamla (#20): egy sikeres fizetes = pontosan egy szamla.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table): void {
            $table->id();
            // RESTRICT: a fizetesek penzugyi nyilvantartas; a felhasznalot csak soft-delete-eljuk.
            $table->foreignId('user_id')->constrained()->restrictOnDelete();
            $table->foreignId('subscription_id')->nullable()->constrained()->nullOnDelete();

            $table->string('provider', 32);
            // Sajat, egyedi azonosito (Barion: PaymentRequestId), mar a szolgaltato hivasa elott.
            $table->uuid('request_id')->unique();
            $table->string('provider_payment_id')->nullable()->unique();
            // A kartya-token azonositoja (Barion: RecurrenceId).
            $table->string('recurrence_id', 100);

            $table->string('purpose', 16);  // initial | renewal
            $table->unsignedInteger('amount');
            $table->char('currency', 3);
            $table->string('status', 16);   // pending | succeeded | failed | canceled | expired
            $table->string('provider_status', 32)->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
