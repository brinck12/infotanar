<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('topic_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->longText('description');
            $table->enum('level', ['kozep', 'emelt']);
            $table->tinyInteger('difficulty')->default(1);
            $table->json('allowed_languages');
            $table->json('starter_code')->nullable();
            $table->boolean('is_published')->default(false);
            $table->timestamps();

            $table->index(['level', 'is_published']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};
