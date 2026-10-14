<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A szobeli gyakorlas allapota temakoronkent: kipipalt vazlatpontok,
 * jegyzet, onertekeles, probalkozasok szama.
 *
 * A `checked` es a `scores` JSON oszlop adatbazis-alapertek nelkul: a MySQL
 * JSON oszlopnak nem enged literal alaperteket, ezert az ures listat es az
 * ures objektumot a modell adja (OralPractice::$attributes).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('oral_practices', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            // A temakor slugja (config/learning.php `oral_topics`).
            $table->string('topic', 64);
            // A kipipalt vazlatpontok sorszamai.
            $table->json('checked');
            $table->text('notes')->nullable();
            // Szempont -> 0..4.
            $table->json('scores');
            $table->unsignedInteger('attempts')->default(0);
            $table->timestamp('last_practiced_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'topic']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('oral_practices');
    }
};
