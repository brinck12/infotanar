<?php

declare(strict_types=1);

namespace App\Services\Health\Checks;

use App\Services\Health\CheckResult;
use App\Services\Health\HealthCheck;
use Illuminate\Support\Facades\DB;

final class DatabaseCheck implements HealthCheck
{
    public function name(): string
    {
        return 'database';
    }

    public function run(): CheckResult
    {
        DB::select('select 1');

        return CheckResult::ok();
    }
}
