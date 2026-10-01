<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('submissions', function (Blueprint $table): void {
            // A beadas egy megoldas megnyitasa UTAN keszult (#154): a lecke igy is teljesul,
            // de az elemzes (#164) kulon tudja valasztani a segitseggel megoldottakat.
            $table->boolean('assisted')->default(false)->after('verdict');
        });
    }

    public function down(): void
    {
        Schema::table('submissions', function (Blueprint $table): void {
            $table->dropColumn('assisted');
        });
    }
};
