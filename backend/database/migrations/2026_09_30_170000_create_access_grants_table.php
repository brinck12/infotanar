<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Kezi premium hozzaferes (osztondij, tamogatasi eset) a szamlazastol
 * fuggetlenul (#51). Visszavonaskor nem torlunk, csak lezarunk, hogy a
 * tortenet (ki, mikor, miert) megmaradjon.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('access_grants', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('granted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('reason', 500);
            $table->timestamp('ends_at')->nullable();
            $table->timestamp('revoked_at')->nullable();
            $table->foreignId('revoked_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['user_id', 'revoked_at', 'ends_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('access_grants');
    }
};
