<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Spreadsheet;

/** Egy diagram, formatumtol fuggetlenul: amit az ertekelolap `chart` vizsgalata kerdezhet rola. */
final readonly class Chart
{
    public const COLUMN = 'column';

    public const BAR = 'bar';

    public const LINE = 'line';

    public const SCATTER = 'scatter';

    public const PIE = 'pie';

    public const AREA = 'area';

    public const DOUGHNUT = 'doughnut';

    public const RADAR = 'radar';

    public const BUBBLE = 'bubble';

    public const OTHER = 'other';

    public function __construct(
        /** A munkalap neve, amelyen a diagram all. */
        public string $sheet,
        /** A fenti tipusok egyike; amit nem ismerunk fel, az OTHER. */
        public string $type,
        public ?string $title = null,
        /** A vizszintes (kategoria-) tengely cime. */
        public ?string $xTitle = null,
        /** A fuggoleges (ertek-) tengely cime. */
        public ?string $yTitle = null,
        public int $seriesCount = 0,
        /** Latszanak-e adatfeliratok (ertek, szazalek vagy kategorianev) legalabb egy adatsoron. */
        public bool $hasLabels = false,
        public bool $hasLegend = false,
    ) {}
}
