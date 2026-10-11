<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Spreadsheet;

/**
 * Egy felteteles formazasi szabaly, formatumtol fuggetlenul: mely cellakra
 * vonatkozik, mi a feltetele, es milyen kitoltest ad.
 */
final readonly class ConditionalFormat
{
    // A szabaly fajtai; az ertekelolap `rule:` feltetele ezeket a neveket hasznalja.
    public const GREATER_THAN = 'greater_than';

    public const LESS_THAN = 'less_than';

    public const GREATER_OR_EQUAL = 'greater_or_equal';

    public const LESS_OR_EQUAL = 'less_or_equal';

    public const EQUAL = 'equal';

    public const NOT_EQUAL = 'not_equal';

    public const BETWEEN = 'between';

    public const NOT_BETWEEN = 'not_between';

    public const CONTAINS_TEXT = 'contains_text';

    public const BEGINS_WITH = 'begins_with';

    public const ENDS_WITH = 'ends_with';

    public const TOP = 'top';

    public const BOTTOM = 'bottom';

    public const ABOVE_AVERAGE = 'above_average';

    public const BELOW_AVERAGE = 'below_average';

    public const DUPLICATE = 'duplicate';

    public const UNIQUE = 'unique';

    public const FORMULA = 'formula';

    public const COLOR_SCALE = 'color_scale';

    public const DATA_BAR = 'data_bar';

    public const ICON_SET = 'icon_set';

    public const OTHER = 'other';

    /** Szabalyfajta => ennyi kuszoberteke (argumentuma) van. */
    public const ARGUMENTS = [
        self::GREATER_THAN => 1, self::LESS_THAN => 1, self::GREATER_OR_EQUAL => 1, self::LESS_OR_EQUAL => 1,
        self::EQUAL => 1, self::NOT_EQUAL => 1, self::BETWEEN => 2, self::NOT_BETWEEN => 2,
        self::CONTAINS_TEXT => 1, self::BEGINS_WITH => 1, self::ENDS_WITH => 1,
        self::TOP => 1, self::BOTTOM => 1, self::ABOVE_AVERAGE => 0, self::BELOW_AVERAGE => 0,
        self::DUPLICATE => 0, self::UNIQUE => 0, self::FORMULA => 1,
        self::COLOR_SCALE => 0, self::DATA_BAR => 0, self::ICON_SET => 0,
    ];

    /**
     * @param  list<CellRange>  $ranges  a szabaly cellai
     * @param  list<string>  $arguments  a kuszobertekek, ahogy a fajlban allnak (szam, szoveg idezojel nelkul, vagy kanonikus keplet)
     */
    public function __construct(
        public array $ranges,
        public string $rule,
        public array $arguments = [],
        /** A szabaly kitoltoszine kanonikus alakban ("FF0000"); null, ha nincs, vagy nem allapithato meg. */
        public ?string $fill = null,
    ) {}

    /** A szabaly a megadott tartomany minden cellajara vonatkozik-e. */
    public function covers(CellRange $range): bool
    {
        foreach ($this->ranges as $own) {
            if ($own->contains($range)) {
                return true;
            }
        }

        return false;
    }
}
