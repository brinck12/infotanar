<?php

declare(strict_types=1);

namespace App\Enums;

enum InvoiceStatus: string
{
    /** Kiallitasra var (vagy egy bizonytalan kimenetelu kiserlet utan ellenorzesre). */
    case Pending = 'pending';

    /** A Szamlazz.hu kiallitotta; a szamlaszam rogzitve. */
    case Issued = 'issued';

    /** A Szamlazz.hu vegleges hibaval utasitotta el: kezi beavatkozas kell. */
    case Failed = 'failed';
}
