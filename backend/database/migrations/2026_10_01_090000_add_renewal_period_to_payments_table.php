<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Megujitasi terheles (#98): melyik idoszak vegere szol. Az egyedi index
 * garantalja, hogy egy elofizetes egy idoszakara legfeljebb egy megujitasi
 * fizetes jojjon letre, akkor is, ha az utemezett job tobbszor vagy
 * parhuzamosan fut. (NULL-ok nem utkoznek: a tobbi fizetesre nem hat.)
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table): void {
            $table->timestamp('renews_period_ending_at')->nullable()->after('purpose');
            $table->unique(['subscription_id', 'renews_period_ending_at']);
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table): void {
            // MySQL-en a subscription_id idegen kulcsa az osszetett egyedi indexre
            // tamaszkodik; sajat index nelkul az eldobasa 1553-as hibaval megall (#126).
            $table->index('subscription_id');
            $table->dropUnique(['subscription_id', 'renews_period_ending_at']);
            $table->dropColumn('renews_period_ending_at');
        });
    }
};
