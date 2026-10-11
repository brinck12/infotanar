<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Spreadsheet;

use App\Services\FileTasks\Grammar\Colors;
use App\Services\FileTasks\Grammar\Lengths;
use DOMElement;
use DOMNode;

/**
 * Egy ods fajl stilusai (content.xml es styles.xml): a cellastilusok szamformatuma,
 * az oszlopok szelessege, a sorok magassaga es a felteteles formazasok
 * kitoltese. Allapotos gyujto: a beolvasas elejen toltjuk, utana csak olvassuk.
 */
final class OdsStyles
{
    private const NUMBER_STYLES = ['number-style', 'percentage-style', 'currency-style', 'date-style', 'time-style', 'text-style', 'boolean-style'];

    /** @var array<string, string> adatstilus neve => Excel-szeru formatumkod */
    private array $dataStyles = [];

    /** @var array<string, array{parent: string|null, data: string|null, width: float|null, height: float|null, optimal: bool, fill: string|null}> */
    private array $styles = [];

    /** A `style:styles` es az `automatic-styles` elem gyerekeinek felvetele. */
    public function add(DOMNode $container): void
    {
        foreach ($container->childNodes as $style) {
            if (! $style instanceof DOMElement) {
                continue;
            }

            if ($style->namespaceURI === OdfNs::NUMBER && in_array($style->localName, self::NUMBER_STYLES, true)) {
                $name = OdfNs::attribute($style, OdfNs::STYLE, 'name');

                if ($name !== null) {
                    $this->dataStyles[$name] = $this->formatCode($style);
                }
            } elseif ($style->namespaceURI === OdfNs::STYLE && $style->localName === 'style') {
                $this->addStyle($style);
            }
        }
    }

    /** Az oszlop szelessege milliméterben; null, ha a stilus nem ad meg szelesseget. */
    public function columnWidth(?string $style): ?float
    {
        return $this->inherited($style, 'width');
    }

    /** A sor magassaga pontban, ha a stilus kezzel allitott magassagot ad (nem "optimalis"). */
    public function rowHeight(?string $style): ?float
    {
        $info = $style === null ? null : ($this->styles[$style] ?? null);

        if ($info === null || $info['optimal'] || $info['height'] === null) {
            return null;
        }

        return $info['height'] / 25.4 * 72;
    }

    /** A cellastilus szamformatum-kodja; a stilus lancon (szulo) felfele keresve, kulonben Altalanos. */
    public function format(?string $style): string
    {
        $seen = [];

        while ($style !== null && ! isset($seen[$style]) && isset($this->styles[$style])) {
            $seen[$style] = true;
            $data = $this->styles[$style]['data'];

            if ($data !== null) {
                return $this->dataStyles[$data] ?? NumberFormatCode::GENERAL;
            }

            $style = $this->styles[$style]['parent'];
        }

        return NumberFormatCode::GENERAL;
    }

    /** A (felteteles) stilus hatterszine kanonikus alakban; null, ha nincs. */
    public function fill(?string $style): ?string
    {
        $seen = [];

        while ($style !== null && ! isset($seen[$style]) && isset($this->styles[$style])) {
            $seen[$style] = true;

            if ($this->styles[$style]['fill'] !== null) {
                return $this->styles[$style]['fill'];
            }

            $style = $this->styles[$style]['parent'];
        }

        return null;
    }

    private function inherited(?string $style, string $key): ?float
    {
        $seen = [];

        while ($style !== null && ! isset($seen[$style]) && isset($this->styles[$style])) {
            $seen[$style] = true;
            $value = $this->styles[$style][$key];

            if (is_float($value)) {
                return $value;
            }

            $style = $this->styles[$style]['parent'];
        }

        return null;
    }

    private function addStyle(DOMElement $style): void
    {
        $name = OdfNs::attribute($style, OdfNs::STYLE, 'name');

        if ($name === null) {
            return;
        }

        $column = OdfNs::child($style, OdfNs::STYLE, 'table-column-properties');
        $row = OdfNs::child($style, OdfNs::STYLE, 'table-row-properties');
        $cell = OdfNs::child($style, OdfNs::STYLE, 'table-cell-properties');

        $width = $column === null ? null : OdfNs::attribute($column, OdfNs::STYLE, 'column-width');
        $height = $row === null ? null : OdfNs::attribute($row, OdfNs::STYLE, 'row-height');
        $background = $cell === null ? null : OdfNs::attribute($cell, OdfNs::FO, 'background-color');

        $this->styles[$name] = [
            'parent' => OdfNs::attribute($style, OdfNs::STYLE, 'parent-style-name'),
            'data' => OdfNs::attribute($style, OdfNs::STYLE, 'data-style-name'),
            'width' => $width === null ? null : Lengths::toMillimetres($width),
            'height' => $height === null ? null : Lengths::toMillimetres($height),
            'optimal' => $row !== null && OdfNs::attribute($row, OdfNs::STYLE, 'use-optimal-row-height') === 'true',
            'fill' => $background === null || $background === 'transparent' ? null : Colors::parse($background),
        ];
    }

    /** Egy ODF adatstilus Excel-szeru, angol jelolesu formatumkodja. */
    private function formatCode(DOMElement $style): string
    {
        $isDate = in_array($style->localName, ['date-style', 'time-style'], true);
        $code = '';

        foreach ($style->childNodes as $part) {
            if (! $part instanceof DOMElement || $part->namespaceURI !== OdfNs::NUMBER) {
                continue;
            }

            $long = OdfNs::attribute($part, OdfNs::NUMBER, 'style') === 'long';

            $code .= match ($part->localName) {
                'number' => $this->numberPattern($part),
                'scientific-number' => '0.00E+00',
                'fraction' => '# ?/?',
                'text-content' => '@',
                'day' => $long ? 'dd' : 'd',
                'month' => OdfNs::attribute($part, OdfNs::NUMBER, 'textual') === 'true' ? ($long ? 'mmmm' : 'mmm') : ($long ? 'mm' : 'm'),
                'year' => $long ? 'yyyy' : 'yy',
                'day-of-week' => $long ? 'dddd' : 'ddd',
                'hours' => $long ? 'hh' : 'h',
                'minutes' => $long ? 'mm' : 'm',
                'seconds' => $long ? 'ss' : 's',
                'am-pm' => 'AM/PM',
                'currency-symbol' => '"'.str_replace('"', '', $part->textContent).'"',
                'text' => $this->literal($part->textContent, $isDate),
                default => '',
            };
        }

        return $code === '' ? NumberFormatCode::GENERAL : $code;
    }

    private function numberPattern(DOMElement $number): string
    {
        $places = max(0, min(30, (int) (OdfNs::attribute($number, OdfNs::NUMBER, 'decimal-places') ?? 0)));
        $minimum = max(1, min(30, (int) (OdfNs::attribute($number, OdfNs::NUMBER, 'min-integer-digits') ?? 1)));
        $grouping = OdfNs::attribute($number, OdfNs::NUMBER, 'grouping') === 'true';

        $integer = $grouping ? '#,##0' : str_repeat('0', $minimum);

        return $integer.($places > 0 ? '.'.str_repeat('0', $places) : '');
    }

    /** Beillesztett szoveg a kodban: datumnal nyersen, egyebkent idezojelben; a szazalekjel es a szokoz nyers. */
    private function literal(string $text, bool $raw): string
    {
        if ($text === '' || $text === '%' || trim($text) === '' || $raw) {
            return str_replace('"', '', $text);
        }

        return '"'.str_replace('"', '', $text).'"';
    }
}
