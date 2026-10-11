<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Spreadsheet;

use App\Services\Files\XmlSafety;
use App\Services\Files\ZipSafety;
use App\Services\FileTasks\UnreadableFile;
use Illuminate\Support\Facades\Config;
use XMLReader;
use ZipArchive;

/**
 * Egy ods (OpenDocument Spreadsheet) munkafuzet olvasasa a formatumfuggetlen
 * modellbe. A content.xml-t folyamolvasoval jarjuk be, soronkent kibontva;
 * az ismetlodo (`number-*-repeated`) ures sorokat es cellakat nem fejtjuk ki.
 * A kepletet nem szamoljuk ujra: a fajlba mentett eredmenyt olvassuk.
 */
final readonly class OdsParser
{
    private const MAX_SHEETS = 100;

    private const MAX_CHARTS = 50;

    public function __construct(private ZipSafety $zip, private OdsChartParser $charts) {}

    /** @throws UnreadableFile */
    public function parse(ZipArchive $archive): SpreadsheetModel
    {
        $content = $this->zip->read($archive, 'content.xml') ?? throw new UnreadableFile('Nincs content.xml a csomagban.');

        $styles = new OdsStyles;
        $named = $this->zip->read($archive, 'styles.xml');

        if ($named !== null) {
            $root = XmlSafety::load($named)->documentElement ?? throw new UnreadableFile('Ures styles.xml.');

            // A gyoker csak tarolo (`office:styles`, `office:automatic-styles`, ...): a stilusok azok gyerekei.
            foreach ([['styles'], ['automatic-styles']] as [$container]) {
                foreach (OdfNs::children($root, OdfNs::OFFICE, $container) as $element) {
                    $styles->add($element);
                }
            }
        }

        $walk = new OdsSheetBuilder($styles, new CellBudget(Config::integer('filetasks.max_dom_nodes')));

        Xml::stream($content, function (XMLReader $reader) use ($walk): void {
            Xml::eachElement($reader, function (XMLReader $reader) use ($walk): bool {
                if ($reader->namespaceURI === OdfNs::OFFICE && $reader->localName === 'automatic-styles') {
                    $element = Xml::expand($reader);

                    if ($element !== null) {
                        $walk->styles->add($element);
                    }

                    return true;
                }

                if ($reader->namespaceURI === OdfNs::TABLE) {
                    return match ($reader->localName) {
                        'table' => $walk->beginTable(
                            $reader->getAttributeNs('name', OdfNs::TABLE),
                            $reader->getAttributeNs('print-ranges', OdfNs::TABLE),
                        ),
                        'table-column' => $walk->column(
                            (int) ($reader->getAttributeNs('number-columns-repeated', OdfNs::TABLE) ?? 1),
                            $reader->getAttributeNs('style-name', OdfNs::TABLE),
                            $reader->getAttributeNs('default-cell-style-name', OdfNs::TABLE),
                            $reader->getAttributeNs('visibility', OdfNs::TABLE),
                        ),
                        'table-row' => $walk->row($reader),
                        default => false,
                    };
                }

                if ($reader->namespaceURI === OdfNs::CALCEXT && $reader->localName === 'conditional-formats') {
                    return $walk->conditionalFormats(Xml::expand($reader));
                }

                if ($reader->namespaceURI === OdfNs::DRAW && $reader->localName === 'object') {
                    return $walk->object($reader->getAttributeNs('href', OdfNs::XLINK));
                }

                return false;
            });
        });

        $sheets = $walk->finish();

        if ($sheets === []) {
            throw new UnreadableFile('A munkafuzetben nincs munkalap.');
        }

        if (count($sheets) > self::MAX_SHEETS) {
            $sheets = array_slice($sheets, 0, self::MAX_SHEETS);
        }

        return new SpreadsheetModel($sheets, $this->charts($archive, $walk->objects));
    }

    /**
     * @param  list<array{0: string, 1: string}>  $objects  [munkalap neve, beagyazott objektum utvonala]
     * @return list<Chart>
     */
    private function charts(ZipArchive $archive, array $objects): array
    {
        $charts = [];

        foreach ($objects as [$sheet, $href]) {
            $directory = trim(preg_replace('#^\./#', '', $href) ?? '', '/');

            if ($directory === '' || str_contains($directory, '..')) {
                continue;
            }

            $xml = $this->zip->read($archive, $directory.'/content.xml');
            $chart = $xml === null ? null : $this->charts->parse(XmlSafety::load($xml), $sheet);

            if ($chart !== null) {
                $charts[] = $chart;
            }

            if (count($charts) >= self::MAX_CHARTS) {
                break;
            }
        }

        return $charts;
    }
}
