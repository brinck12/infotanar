<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Folyamatban levo, darabokban feltoltott leckevideok (#158). A darabok a
     * szerveren, a staging taroloban vannak; ez a tabla azt tudja, hova tartoznak,
     * mekkora a fajl, es hany darabbol kell allnia. A befejezett vagy megszakitott
     * feltoltes sora torlodik, a felbehagyottakat az idozitett takaritas.
     */
    public function up(): void
    {
        Schema::create('lesson_uploads', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignId('lesson_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            // A kliens altal megadott nev: csak megjelenitesre, a tarolt nev veletlen.
            $table->string('filename');
            $table->unsignedBigInteger('size');
            $table->unsignedInteger('part_size');
            $table->unsignedInteger('total_parts');
            $table->timestamps();

            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lesson_uploads');
    }
};
