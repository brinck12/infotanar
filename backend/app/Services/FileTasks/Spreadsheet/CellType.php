<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Spreadsheet;

/** Egy cella ertekenek fajtaja, a fajlformatumtol fuggetlenul. */
enum CellType
{
    /** Nincs tarolt ertek. Kepletes cellanal azt jelenti, hogy a fajl nem tartalmazza a kiszamolt eredmenyt. */
    case Blank;

    /** Szam; a datum es az ido is ez (sorszam, a nap tortreszevel). */
    case Number;

    case Text;

    case Boolean;

    /** Hibaertek, pl. #DIV/0! vagy #NÉV?. */
    case Error;
}
