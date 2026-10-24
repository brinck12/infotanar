<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A kozossegi belepessel (Google) nyitott fiokhoz nincs jelszo. NULL = nincs
 * jelszo; ilyen fiokkal jelszavas belepes nem lehetseges, amig a tulajdonos
 * az "elfelejtett jelszo" folyamaton at nem allit be egyet.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->string('password')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->string('password')->nullable(false)->change();
        });
    }
};
