<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * A naplo-nezet (#161) legfrissebb elol lapoz, es tárgyra, szereplore, muveletre szur.
     * Az `(action, created_at)` index mar megvan; ezek a tobbi szuresi utat fedik.
     */
    public function up(): void
    {
        Schema::table('audit_logs', function (Blueprint $table): void {
            $table->index(['created_at', 'id']);
            $table->index(['subject_type', 'subject_id', 'created_at']);
            $table->index(['actor_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::table('audit_logs', function (Blueprint $table): void {
            $table->dropIndex(['created_at', 'id']);
            $table->dropIndex(['subject_type', 'subject_id', 'created_at']);
            $table->dropIndex(['actor_id', 'created_at']);
        });
    }
};
