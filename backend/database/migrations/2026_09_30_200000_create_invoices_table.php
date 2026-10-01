<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Szamlak (#20, ADR 0002). A `payment_id` egyedi indexe garantalja, hogy egy
 * fizeteshez legfeljebb egy szamla-sor tartozik; a vevo adatai masolatkent
 * kerulnek ide, mert a szamla a kiallitaskori allapotot rogziti (szamviteli
 * megorzes), fuggetlenul a kesobb modosithato vagy torolheto profiltol.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoices', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('payment_id')->unique()->constrained()->restrictOnDelete();
            $table->foreignId('user_id')->constrained()->restrictOnDelete();
            $table->string('provider', 32);
            $table->string('status', 16);
            $table->string('invoice_number', 64)->nullable()->unique();
            $table->json('buyer');
            $table->string('vat_rate', 8);
            $table->unsignedInteger('net_amount');
            $table->unsignedInteger('vat_amount');
            $table->unsignedInteger('gross_amount');
            $table->char('currency', 3);
            $table->string('pdf_path')->nullable();
            $table->unsignedSmallInteger('attempts')->default(0);
            $table->string('last_error', 500)->nullable();
            $table->timestamp('issued_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'updated_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
