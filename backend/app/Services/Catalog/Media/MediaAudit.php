<?php

declare(strict_types=1);

namespace App\Services\Catalog\Media;

/** A videotarolo es a leckek ellenorzesenek eredmenye (#158). */
final readonly class MediaAudit
{
    /**
     * @param  list<string>  $orphans  A taroloban van, de egy lecke sem hivatkozik ra (helyet foglal).
     * @param  list<string>  $dangling  Egy lecke hivatkozik ra, de nincs a taroloban (a diak hibat kapna).
     */
    public function __construct(
        public array $orphans,
        public array $dangling,
    ) {}

    public function isClean(): bool
    {
        return $this->orphans === [] && $this->dangling === [];
    }
}
