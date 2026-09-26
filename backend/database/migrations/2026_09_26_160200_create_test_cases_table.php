<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('test_cases', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained()->cascadeOnDelete();
            $table->text('stdin')->nullable();
            $table->text('expected_stdout');
            $table->boolean('is_hidden')->default(true);
            $table->integer('order')->default(0);
            $table->timestamps();

            $table->index(['task_id', 'order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('test_cases');
    }
};
