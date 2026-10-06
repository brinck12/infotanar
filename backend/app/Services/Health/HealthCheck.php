<?php

declare(strict_types=1);

namespace App\Services\Health;

/** Egy fuggoseg allapotanak ellenorzese. Kivetelt dobhat: azt a hivo hibakent kezeli. */
interface HealthCheck
{
    /** Rovid, stabil azonosito a valaszban (pl. "database"). */
    public function name(): string;

    public function run(): CheckResult;
}
