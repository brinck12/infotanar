<?php

declare(strict_types=1);

namespace App\Services\Admin\Audit;

use App\Enums\AuditAction;
use Carbon\CarbonImmutable;

/** A naplo-nezet (#161) szurofeltetelei; mind elhagyhato. */
final readonly class AuditLogFilters
{
    public function __construct(
        public ?AuditAction $action = null,
        public ?int $actorId = null,
        /** A morph-alias (pl. `exercise`), nem az osztalynev. */
        public ?string $subjectType = null,
        public ?int $subjectId = null,
        /** Ettol (zart). */
        public ?CarbonImmutable $from = null,
        /** Eddig (nyitott: a megadott pillanat mar nem tartozik bele). */
        public ?CarbonImmutable $to = null,
    ) {}
}
