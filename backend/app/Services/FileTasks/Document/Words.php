<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Document;

use App\Services\FileTasks\Grammar\Text;

/**
 * A szerző által beírt magyar (és angol) szavak egységes kulcsokra
 * fordítása, és vissza a diaknak szóló megjelenítésre. Ismeretlen szó: null.
 */
final class Words
{
    private const ALIGNMENT = [
        'balra' => 'left', 'bal' => 'left', 'left' => 'left',
        'kozepre' => 'center', 'kozep' => 'center', 'kozepen' => 'center', 'center' => 'center',
        'jobbra' => 'right', 'jobb' => 'right', 'right' => 'right',
        'sorkizart' => 'justify', 'sorkizarva' => 'justify', 'justify' => 'justify', 'justified' => 'justify',
    ];

    private const ORIENTATION = [
        'allo' => 'portrait', 'portrait' => 'portrait',
        'fekvo' => 'landscape', 'landscape' => 'landscape',
    ];

    private const WRAP = [
        'sorban' => 'inline', 'szovegsorban' => 'inline', 'inline' => 'inline',
        'negyzetes' => 'square', 'negyzet' => 'square', 'square' => 'square',
        'szorosan' => 'tight', 'tight' => 'tight',
        'atfuto' => 'through', 'through' => 'through',
        'fentesalul' => 'topbottom', 'fentlent' => 'topbottom', 'topbottom' => 'topbottom', 'topandbottom' => 'topbottom',
        'szovegmogott' => 'behind', 'mogotte' => 'behind', 'behind' => 'behind',
        'szovegelott' => 'front', 'elotte' => 'front', 'front' => 'front', 'infrontoftext' => 'front',
    ];

    private const TAB_TYPE = [
        'balra' => 'left', 'bal' => 'left', 'left' => 'left',
        'kozepre' => 'center', 'kozep' => 'center', 'center' => 'center',
        'jobbra' => 'right', 'jobb' => 'right', 'right' => 'right',
        'tizedes' => 'decimal', 'decimal' => 'decimal',
        'fuggoleges' => 'bar', 'bar' => 'bar',
    ];

    private const LEADER = [
        'pont' => 'dot', 'pontozott' => 'dot', 'dot' => 'dot', 'dotted' => 'dot',
        'kotojel' => 'hyphen', 'szaggatott' => 'hyphen', 'hyphen' => 'hyphen', 'dash' => 'hyphen',
        'alahuzas' => 'underscore', 'vonal' => 'underscore', 'underscore' => 'underscore', 'line' => 'underscore',
        'kozeppont' => 'middledot', 'middledot' => 'middledot',
        'nincs' => 'none', 'nelkul' => 'none', 'none' => 'none',
    ];

    private const LIST_TYPE = [
        'bullet' => 'bullet', 'felsorolas' => 'bullet', 'felsorolasjel' => 'bullet', 'jeles' => 'bullet',
        'number' => 'number', 'szamozas' => 'number', 'szamozott' => 'number', 'szam' => 'number',
    ];

    private const BREAK = [
        'oldal' => 'page', 'ujoldal' => 'page', 'page' => 'page',
        'folyamatos' => 'continuous', 'continuous' => 'continuous',
        'paros' => 'even', 'even' => 'even',
        'paratlan' => 'odd', 'odd' => 'odd',
    ];

    public static function alignment(string $word): ?string
    {
        return self::ALIGNMENT[self::key($word)] ?? null;
    }

    public static function orientation(string $word): ?string
    {
        return self::ORIENTATION[self::key($word)] ?? null;
    }

    public static function wrap(string $word): ?string
    {
        return self::WRAP[self::key($word)] ?? null;
    }

    public static function tabType(string $word): ?string
    {
        return self::TAB_TYPE[self::key($word)] ?? null;
    }

    public static function leader(string $word): ?string
    {
        return self::LEADER[self::key($word)] ?? null;
    }

    public static function listType(string $word): ?string
    {
        return self::LIST_TYPE[self::key($word)] ?? null;
    }

    public static function sectionBreak(string $word): ?string
    {
        return self::BREAK[self::key($word)] ?? null;
    }

    /** Megjelenítés a diaknak: a belső kulcs magyar neve. */
    public static function label(string $group, string $key): string
    {
        return __('filetasks_document.words.'.$group.'.'.$key);
    }

    private static function key(string $word): string
    {
        return str_replace([' ', '-', '_', '.'], '', Text::fold($word));
    }
}
