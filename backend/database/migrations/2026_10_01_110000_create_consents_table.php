<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Elfogadott feltetelek nyilvantartasa (#133): ki, mikor, melyik dokumentum
 * melyik verziojat fogadta el. Bizonyitek, ezert csak bovul: sor nem modosul
 * es nem torlodik (a fiok torlesekor a felhasznalo anonimizalodik, a sor marad).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('consents', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->restrictOnDelete();
            $table->string('type', 32);
            $table->string('document_version', 32);
            // A fizeteshez kotott nyilatkozat (azonnali teljesites kerese) melyik fizeteshez tartozik.
            $table->foreignId('payment_id')->nullable()->constrained()->nullOnDelete();
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent', 500)->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['user_id', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('consents');
    }
};
