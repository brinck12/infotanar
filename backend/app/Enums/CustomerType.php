<?php

declare(strict_types=1);

namespace App\Enums;

/** A szamla vevoje: maganszemely, vagy adoszammal rendelkezo ceg / egyeni vallalkozo. */
enum CustomerType: string
{
    case Person = 'person';
    case Company = 'company';
}
