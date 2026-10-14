<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Spreadsheet;

use DOMDocument;
use DOMElement;

/**
 * Egy ods beagyazott diagram (`Object N/content.xml`, ODF chart) olvasasa.
 * Csak a vizsgalatok altal kerdezett jellemzoket olvassuk ki.
 */
final readonly class OdsChartParser
{
    private const CLASSES = [
        'chart:line' => Chart::LINE, 'chart:stock' => Chart::LINE,
        'chart:circle' => Chart::PIE,
        'chart:ring' => Chart::DOUGHNUT,
        'chart:scatter' => Chart::SCATTER,
        'chart:area' => Chart::AREA,
        'chart:radar' => Chart::RADAR, 'chart:filled-radar' => Chart::RADAR,
        'chart:bubble' => Chart::BUBBLE,
    ];

    /** Null, ha a resz nem diagram (pl. beagyazott kepletszerkeszto). */
    public function parse(DOMDocument $document, string $sheet): ?Chart
    {
        $chart = null;

        foreach ($document->getElementsByTagNameNS(OdfNs::CHART, 'chart') as $candidate) {
            $chart = $candidate;
            break;
        }

        if (! $chart instanceof DOMElement) {
            return null;
        }

        $styles = $this->chartStyles($document);
        $plot = OdfNs::child($chart, OdfNs::CHART, 'plot-area');
        $class = OdfNs::attribute($chart, OdfNs::CHART, 'class') ?? '';
        $horizontal = false;

        if ($plot !== null) {
            $plotStyle = OdfNs::attribute($plot, OdfNs::CHART, 'style-name');
            $horizontal = $plotStyle !== null && ($styles[$plotStyle]['vertical'] ?? false);
        }

        $type = match (true) {
            $class === 'chart:bar' => $horizontal ? Chart::BAR : Chart::COLUMN,
            isset(self::CLASSES[$class]) => self::CLASSES[$class],
            default => Chart::OTHER,
        };

        $title = OdfNs::child($chart, OdfNs::CHART, 'title');
        [$xTitle, $yTitle] = $plot === null ? [null, null] : $this->axisTitles($plot, $horizontal);

        $series = $plot === null ? [] : OdfNs::children($plot, OdfNs::CHART, 'series');
        $points = $plot === null ? [] : OdfNs::children($plot, OdfNs::CHART, 'data-point');

        return new Chart(
            $sheet,
            $type,
            $title === null ? null : trim(OdfNs::textOf($title)),
            $xTitle,
            $yTitle,
            count($series),
            $this->hasLabels([...$series, ...$points], $styles),
            OdfNs::child($chart, OdfNs::CHART, 'legend') !== null,
        );
    }

    /**
     * A tengelyek cime. Az ODF a kategoriatengelyt "x"-nek hivja akkor is, ha
     * fekvo oszlopdiagramnal fuggoleges; a felhasznalo a kepernyon latottat
     * ertelmezi vizszintesnek, ezert ott felcserelunk.
     *
     * @return array{0: string|null, 1: string|null}
     */
    private function axisTitles(DOMElement $plot, bool $horizontal): array
    {
        $x = null;
        $y = null;

        foreach (OdfNs::children($plot, OdfNs::CHART, 'axis') as $axis) {
            $title = OdfNs::child($axis, OdfNs::CHART, 'title');
            $text = $title === null ? null : trim(OdfNs::textOf($title));
            $dimension = OdfNs::attribute($axis, OdfNs::CHART, 'dimension');

            if ($dimension === 'x') {
                $x ??= $text;
            } elseif ($dimension === 'y') {
                $y ??= $text;
            }
        }

        return $horizontal ? [$y, $x] : [$x, $y];
    }

    /**
     * @param  list<DOMElement>  $elements  adatsorok es adatpontok
     * @param  array<string, array{vertical: bool, labels: bool}>  $styles
     */
    private function hasLabels(array $elements, array $styles): bool
    {
        foreach ($elements as $element) {
            $style = OdfNs::attribute($element, OdfNs::CHART, 'style-name');

            if ($style !== null && ($styles[$style]['labels'] ?? false)) {
                return true;
            }
        }

        return false;
    }

    /** @return array<string, array{vertical: bool, labels: bool}> */
    private function chartStyles(DOMDocument $document): array
    {
        $styles = [];

        foreach ($document->getElementsByTagNameNS(OdfNs::STYLE, 'style') as $style) {
            $name = OdfNs::attribute($style, OdfNs::STYLE, 'name');
            $properties = OdfNs::child($style, OdfNs::STYLE, 'chart-properties');

            if ($name === null || $properties === null) {
                continue;
            }

            $number = OdfNs::attribute($properties, OdfNs::CHART, 'data-label-number');

            $styles[$name] = [
                'vertical' => OdfNs::attribute($properties, OdfNs::CHART, 'vertical') === 'true',
                'labels' => ($number !== null && $number !== 'none')
                    || OdfNs::attribute($properties, OdfNs::CHART, 'data-label-text') === 'true',
            ];
        }

        return $styles;
    }
}
