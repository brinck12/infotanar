<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Mit nezett meg egy diak (#154). A kikapcsolas nem a bongeszon mulik: a
     * szerver ezekbol tudja, meddig szabad a tippeket, illetve a megoldast adni,
     * es ugyanezekbol lesz elemzes (#164).
     */
    public function up(): void
    {
        Schema::create('hint_reveals', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('exercise_id')->constrained()->cascadeOnDelete();
            // Hanyadik tipp (1-tol): a diak az elso k tippet latja. A tipp tartalma
            // szerkesztheto es atrendezheto, ezert nem a tipp azonositojat taroljuk.
            $table->unsignedSmallInteger('position');
            $table->timestamp('revealed_at');

            // Ket egyideju kerest ez tesz idempotensse.
            $table->unique(['user_id', 'exercise_id', 'position']);
        });

        Schema::create('solution_reveals', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('exercise_id')->constrained()->cascadeOnDelete();
            // Hany sikertelen beadas utan nyitotta meg (megoldas nelkul): elemzeshez.
            $table->unsignedInteger('failed_submissions');
            $table->timestamp('revealed_at');

            $table->unique(['user_id', 'exercise_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('solution_reveals');
        Schema::dropIfExists('hint_reveals');
    }
};
