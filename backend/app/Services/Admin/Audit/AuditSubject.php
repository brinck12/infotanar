<?php

declare(strict_types=1);

namespace App\Services\Admin\Audit;

/** A naplobejegyzes targya ember-olvashato alakban (#161). */
final readonly class AuditSubject
{
    public function __construct(
        public string $type,
        public int $id,
        public string $label,
        /** Az admin felulet utvonala, ha a targy meg letezik es van oldala. */
        public ?string $adminPath,
        /** false: a targyat azota torolték (a felirat a naplo pillanatkepebol jon, ha van). */
        public bool $exists,
    ) {}
}
