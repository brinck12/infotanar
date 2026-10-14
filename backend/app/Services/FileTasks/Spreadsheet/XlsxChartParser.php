<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Spreadsheet;

use DOMDocument;
use DOMElement;

/**
 * Egy xlsx diagramresz (`xl/charts/chart*.xml`, DrawingML) olvasasa. Csak a
 * vizsgalatok altal kerdezett jellemzoket olvassuk ki: tipus, cimek,
 * adatsorok szama, adatfeliratok, jelmagyarazat.
 */
final readonly class XlsxChartParser
{
    /** A plotArea gyerekeinek neve => a modell diagramtipusa. */
    private const TYPES = [
        'lineChart' => Chart::LINE, 'line3DChart' => Chart::LINE, 'stockChart' => Chart::LINE,
        'scatterChart' => Chart::SCATTER,
        'pieChart' => Chart::PIE, 'pie3DChart' => Chart::PIE, 'ofPieChart' => Chart::PIE,
        'doughnutChart' => Chart::DOUGHNUT,
        'areaChart' => Chart::AREA, 'area3DChart' => Chart::AREA,
        'radarChart' => Chart::RADAR,
        'bubbleChart' => Chart::BUBBLE,
    ];

    public function parse(DOMDocument $document, string $sheet): Chart
    {
        $root = Xml::descendant($document, 'chart');
        $plot = $root === null ? null : Xml::child($root, 'plotArea');

        if ($root === null || $plot === null) {
            return new Chart($sheet, Chart::OTHER);
        }

        $title = Xml::child($root, 'title');
        [$xTitle, $yTitle] = $this->axisTitles($plot);

        return new Chart(
            $sheet,
            $this->type($plot),
            $title === null ? null : $this->text($title),
            $xTitle,
            $yTitle,
            count(Xml::descendants($plot, 'ser')),
            $this->hasLabels($plot),
            Xml::child($root, 'legend') !== null,
        );
    }

    private function type(DOMElement $plot): string
    {
        foreach (Xml::children($plot) as $child) {
            $name = (string) $child->localName;

            if ($name === 'barChart' || $name === 'bar3DChart') {
                $direction = Xml::child($child, 'barDir');

                return $direction !== null && Xml::attribute($direction, 'val') === 'bar' ? Chart::BAR : Chart::COLUMN;
            }

            if (isset(self::TYPES[$name])) {
                return self::TYPES[$name];
            }
        }

        return Chart::OTHER;
    }

    /**
     * A vizszintes es a fuggoleges tengely cime a tengely helyzete szerint
     * (`axPos`): igy a fekvo oszlopdiagramnal is az latszik "vizszintesnek",
     * ami a kepernyon az.
     *
     * @return array{0: string|null, 1: string|null}
     */
    private function axisTitles(DOMElement $plot): array
    {
        $horizontal = null;
        $vertical = null;

        foreach (Xml::children($plot) as $axis) {
            if (! in_array($axis->localName, ['catAx', 'valAx', 'dateAx', 'serAx'], true)) {
                continue;
            }

            $position = Xml::child($axis, 'axPos');
            $side = $position === null ? '' : (Xml::attribute($position, 'val') ?? '');
            $title = Xml::child($axis, 'title');
            $text = $title === null ? null : $this->text($title);

            if ($side === 'b' || $side === 't') {
                $horizontal ??= $text;
            } elseif ($side === 'l' || $side === 'r') {
                $vertical ??= $text;
            }
        }

        return [$horizontal, $vertical];
    }

    private function hasLabels(DOMElement $plot): bool
    {
        foreach (Xml::descendants($plot, 'dLbls') as $labels) {
            foreach (['showVal', 'showPercent', 'showCatName', 'showSerName'] as $name) {
                $flag = Xml::child($labels, $name);

                if ($flag !== null && Xml::flag($flag, 'val')) {
                    return true;
                }
            }
        }

        return false;
    }

    /** A cim szovege: a formazott szovegfutamok (`a:t`) egymas utan. */
    private function text(DOMElement $title): string
    {
        $text = '';

        foreach (Xml::descendants($title, 't') as $run) {
            $text .= $run->textContent;
        }

        return trim($text);
    }
}
