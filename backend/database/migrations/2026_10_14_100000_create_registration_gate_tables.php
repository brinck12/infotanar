<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Zart beta regisztracios kapu (LAUNCH-2): meghivokodok, varolista es
 * admin altal allithato kulcs-ertek beallitasok (pl. registration_mode).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invite_codes', function (Blueprint $table): void {
            $table->id();
            $table->string('code', 32)->unique();
            // Pl. az osztaly neve: kesobb is kiderul, kinek adtuk.
            $table->string('label', 100);
            $table->unsignedInteger('max_uses')->nullable();
            $table->unsignedInteger('uses')->default(0);
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('disabled_at')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('waitlist_entries', function (Blueprint $table): void {
            $table->id();
            $table->string('email')->unique();
            $table->string('note', 255)->nullable();
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('app_settings', function (Blueprint $table): void {
            $table->string('key', 64)->primary();
            $table->string('value', 255);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('app_settings');
        Schema::dropIfExists('waitlist_entries');
        Schema::dropIfExists('invite_codes');
    }
};
