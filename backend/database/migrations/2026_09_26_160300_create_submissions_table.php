<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('submissions', function (Blueprint $table) {
            $table->id();
            // Az MVP-ben nincs auth, de a mezo mar most legyen a helyen.
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('task_id')->constrained()->cascadeOnDelete();
            $table->string('language');
            $table->longText('source_code');
            $table->enum('status', ['pending', 'running', 'passed', 'failed', 'error'])->default('pending');
            $table->json('results')->nullable();
            $table->timestamps();

            $table->index(['task_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('submissions');
    }
};
