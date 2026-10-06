<?php

declare(strict_types=1);

namespace App\Enums;

enum ConsentType: string
{
    /** Az ASZF elfogadasa regisztraciokor. */
    case Terms = 'terms';

    /** Az adatkezelesi tajekoztato megismerese regisztraciokor. */
    case Privacy = 'privacy';

    /** A vasarlo keri, hogy a szolgaltatas a fizetes utan azonnal induljon (elallasi jog). */
    case ImmediatePerformance = 'immediate_performance';
}
