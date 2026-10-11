<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Spreadsheet;

use App\Services\FileTasks\UnreadableFile;

/**
 * A munkafuzet osszes celljara kozos darabszam-korlat: a tul sok cellas
 * fajlt nem olvassuk be (a memoria es az ido korlatos). Allapotos, ezert
 * nem readonly; egy beolvasashoz egy peldany tartozik.
 */
final class CellBudget
{
    private int $used = 0;

    /** A munkafuzet 1904-es datumrendszert hasznal-e (az olvasas elejen allitjuk be). */
    public bool $date1904 = false;

    public function __construct(private readonly int $limit) {}

    /** @throws UnreadableFile ha elfogyott a keret */
    public function take(int $count = 1): void
    {
        $this->used += $count;

        if ($this->used > $this->limit) {
            throw new UnreadableFile('A munkafuzet tul sok cellat tartalmaz.');
        }
    }
}
