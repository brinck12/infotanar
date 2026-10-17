<?php

declare(strict_types=1);

namespace App\Services\Catalog\Content;

/** A beolvasott tartalmi fa és a beolvasás közben talált hibák. */
final readonly class ContentSet
{
    /**
     * @param  list<TrackNode>  $tracks
     * @param  list<ContentProblem>  $problems
     */
    public function __construct(
        public array $tracks,
        public array $problems,
    ) {}
}
