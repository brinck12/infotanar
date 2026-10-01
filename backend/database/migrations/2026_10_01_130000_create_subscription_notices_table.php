<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Melyik elofizetesi ertesitest kuldtuk mar ki (#137). Az egyedi index
 * garantalja, hogy egy esemenyrol (pl. egy adott idoszak megujitasa) csak
 * egy level menjen, akkor is, ha a Barion callback ketszer erkezik, vagy egy
 * job ujrafut.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subscription_notices', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('subscription_id')->constrained()->cascadeOnDelete();
            $table->string('type', 32);
            // Az idoszak, amelyre az ertesites vonatkozik (az idoszak vege ISO alakban).
            $table->string('period_key', 32);
            $table->timestamp('created_at')->useCurrent();

            $table->unique(['subscription_id', 'type', 'period_key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subscription_notices');
    }
};
