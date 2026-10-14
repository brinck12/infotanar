<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * Az ertekelesi pont vizsgalatanak tipusa (`rubric_items.check_type`).
 *
 * 22 ertek: az admin urlap 18 eleme (RubricBuilder.tsx `CHECK_TYPES`) es negy
 * bovites (sheet_format, conditional_format, list_format, shape). Minden
 * tipushoz egy vagy tobb CheckHandler tartozhat (App\Services\FileTasks); a
 * `property` es az `expected` nyelvtanat a kezelo `validate()` metodusa adja.
 */
enum RubricCheckType: string
{
    // Dokumentum (docx, odt).
    case PageSetup = 'page_setup';
    case CharacterFormat = 'character_format';
    case ParagraphFormat = 'paragraph_format';
    case Style = 'style';
    case DocumentTable = 'document_table';
    case Image = 'image';
    case Section = 'section';
    case TabStop = 'tab_stop';
    case ListFormat = 'list_format';

    // Tablazat (xlsx, ods).
    case CellValue = 'cell_value';
    case CellFormula = 'cell_formula';
    case NumberFormat = 'number_format';
    case SortOrder = 'sort_order';
    case Chart = 'chart';
    case PrintArea = 'print_area';
    case SheetFormat = 'sheet_format';
    case ConditionalFormat = 'conditional_format';

    // Bemutato es vektorgrafika (pptx, odp, svg).
    case Slide = 'slide';
    case Animation = 'animation';
    case Shape = 'shape';

    // Weboldal (html, css).
    case Web = 'web';

    // Osszevetes a mintaval: mindig kezi, barmilyen fajlnal.
    case Manual = 'manual';

    /** A `manual` tipushoz nincs kezelo: az ilyen pont mindig kezi (RubricMode::Manual). */
    public function isManual(): bool
    {
        return $this === self::Manual;
    }

    /** @return list<string> */
    public static function values(): array
    {
        return array_map(static fn (self $type): string => $type->value, self::cases());
    }
}
