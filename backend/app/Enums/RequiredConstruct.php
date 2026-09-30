<?php

declare(strict_types=1);

namespace App\Enums;

/** A megoldasban kotelezoen szereplo nyelvi szerkezet. */
enum RequiredConstruct: string
{
    case ForLoop = 'for_loop';
    case WhileLoop = 'while_loop';
    /** Barmilyen ciklus (for vagy while). */
    case Loop = 'loop';
    /** A megoldas legalabb egy fuggvenye sajat magat hivja. */
    case Recursion = 'recursion';

    public function describe(): string
    {
        return __("constraints.require.{$this->value}");
    }
}
