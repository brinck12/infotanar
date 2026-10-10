<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * Az irasbeli vizsga egy reszenek kulcsa (`exam_parts.key`); a frontend ebbol
 * valaszt ikont (frontend/src/shared/domain/exam.ts `ExamPart['key']`).
 */
enum ExamPartKey: string
{
    case Szoveg = 'szoveg';
    case Vizualis = 'vizualis';
    case Tablazat = 'tablazat';
    case Adatbazis = 'adatbazis';
    case Programozas = 'programozas';
    case Dokumentum = 'dokumentum';
}
