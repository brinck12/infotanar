<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Szamlazasi adatok (#19): felhasznalonkent egy, a checkout elott kotelezo.
 * A kiallitott szamla (#20) sajat masolatot tart rola, ezert a profil
 * szabadon modosithato es fioktorleskor torolheto.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('billing_profiles', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('customer_type', 16);
            $table->string('name');
            $table->char('country', 2);
            $table->string('postal_code', 10);
            $table->string('city', 100);
            $table->string('address_line');
            $table->string('tax_number', 13)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('billing_profiles');
    }
};
