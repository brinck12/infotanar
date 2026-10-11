<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Vector;

use App\Services\Files\PrivateFileStore;
use App\Services\Files\StoredFile;
use App\Services\Files\UploadedFileInspector;
use App\Services\Files\XmlSafety;
use App\Services\FileTasks\FileReader;
use App\Services\FileTasks\OpenedFile;
use App\Services\FileTasks\Presentation\ImageModel;
use App\Services\FileTasks\Presentation\ShapeModel;
use App\Services\FileTasks\UnreadableFile;
use App\Services\FileTasks\Web\CssColors;
use App\Services\FileTasks\Web\CssParser;
use App\Services\FileTasks\Web\CssRule;
use DOMDocument;
use DOMElement;
use Illuminate\Contracts\Filesystem\FileNotFoundException;
use LengthException;

/**
 * Az svg olvasoja. A fajlt az XmlSafety-n at tolti be: DOCTYPE-ot vagy
 * ENTITY-t tartalmazo svg nem olvashato (UnreadableFile). A szkripteket, a
 * <foreignObject>-et es a kulso hivatkozasokat (<image href>, <use>) nem
 * hajtja vegre es nem toltjuk le, a svg-t soha nem jelenitjuk meg a szerveren.
 *
 * Az alakzatok stilusa a megjelenitesi attributumokbol, a <style> egyszeru
 * szelektoraibol (tag, .osztaly, #id, tag.osztaly) es a style attributumbol
 * all ossze, ebben a sorrendben nyer a kesobbi.
 */
final readonly class SvgReader implements FileReader
{
    private const NS = 'http://www.w3.org/2000/svg';

    private const SKIPPED = [
        'defs', 'symbol', 'clippath', 'mask', 'pattern', 'marker', 'style', 'script', 'title', 'desc', 'metadata',
        'foreignobject', 'lineargradient', 'radialgradient', 'filter', 'use',
    ];

    private const CONTAINERS = ['svg', 'g', 'a', 'switch'];

    private const SHAPES = [
        'rect' => 'rect', 'circle' => 'ellipse', 'ellipse' => 'ellipse', 'line' => 'line',
        'polyline' => 'polyline', 'polygon' => 'polygon', 'path' => 'path', 'text' => 'text',
    ];

    private const MM_PER_UNIT = ['' => 25.4 / 96, 'px' => 25.4 / 96, 'pt' => 25.4 / 72, 'pc' => 25.4 / 6, 'mm' => 1.0, 'cm' => 10.0, 'in' => 25.4];

    private const MAX_DEPTH = 64;

    /** Egy svg-ben legfeljebb ennyi stilusszabaly lehet. */
    private const MAX_RULES = 2000;

    public function __construct(
        private PrivateFileStore $files,
        private CssParser $css,
    ) {}

    /** @return list<string> */
    public function extensions(): array
    {
        return ['.svg'];
    }

    public function open(StoredFile $file): OpenedFile
    {
        try {
            $xml = $this->files->bytes($file, UploadedFileInspector::maxBytesFor('image'));
        } catch (FileNotFoundException|LengthException $exception) {
            throw new UnreadableFile('Az svg nem olvashato.', $exception);
        }

        $xml = str_starts_with($xml, "\xEF\xBB\xBF") ? substr($xml, 3) : $xml;
        $document = XmlSafety::load($xml);
        $root = $document->documentElement;

        if ($root === null || $root->localName !== 'svg' || $root->namespaceURI !== self::NS) {
            throw new UnreadableFile('A fajl gyokere nem svg.');
        }

        $rules = $this->rules($document);
        $shapes = [];
        $images = [];
        $this->walk($root, $this->style($root, $rules), ['fill' => 'black', 'fill-opacity' => '1'], 1.0, $rules, $shapes, $images, 0);

        [$width, $height] = $this->size($root);

        return new SvgModel($width, $height, $shapes, $images);
    }

    /**
     * A feltetel nelkuli szabalyok szelektor szerint indexelve; minden szabaly mellett a
     * dokumentum-sorrendbeli sorszama (a kesobbi szabaly nyer). Az osszes szabaly szama
     * a dokumentumban korlatos, igy az elemenkenti keresés is.
     *
     * @return array<string, list<array{0: int, 1: CssRule}>>
     */
    private function rules(DOMDocument $document): array
    {
        $indexed = [];
        $count = 0;

        foreach ($document->getElementsByTagNameNS(self::NS, 'style') as $style) {
            foreach ($this->css->parse($style->textContent) as $rule) {
                if ($rule->media !== null) {
                    continue;
                }

                if (++$count > self::MAX_RULES) {
                    throw new UnreadableFile('Az svg tul sok CSS-szabalyt tartalmaz.');
                }

                $indexed[$rule->selector][] = [$count, $rule];
            }
        }

        return $indexed;
    }

    /** @return array{0: float|null, 1: float|null} */
    private function size(DOMElement $root): array
    {
        $width = $this->millimetres($root->getAttribute('width'));
        $height = $this->millimetres($root->getAttribute('height'));

        if (($width === null || $height === null) && preg_match('/^\s*[-\d.]+[ ,]+[-\d.]+[ ,]+(\d*\.?\d+)[ ,]+(\d*\.?\d+)\s*$/', $root->getAttribute('viewBox'), $match) === 1) {
            $width ??= (float) $match[1] * self::MM_PER_UNIT['px'];
            $height ??= (float) $match[2] * self::MM_PER_UNIT['px'];
        }

        return [$width, $height];
    }

    /**
     * @param  array<string, string>  $style  az elem sajat, mar kiszamolt stilusa
     * @param  array<string, string>  $inherited
     * @param  array<string, list<array{0: int, 1: CssRule}>>  $rules
     * @param  list<ShapeModel>  $shapes
     * @param  list<ImageModel>  $images
     */
    private function walk(DOMElement $element, array $style, array $inherited, float $opacity, array $rules, array &$shapes, array &$images, int $depth): void
    {
        if ($depth > self::MAX_DEPTH) {
            throw new UnreadableFile('Az svg tul melyen egymasba agyazott.');
        }

        $inherited['fill'] = $style['fill'] ?? $inherited['fill'];
        $inherited['fill-opacity'] = $style['fill-opacity'] ?? $inherited['fill-opacity'];
        $opacity *= $this->number($style['opacity'] ?? '1');

        foreach ($element->childNodes as $child) {
            if (! $child instanceof DOMElement || $child->namespaceURI !== self::NS) {
                continue;
            }

            $name = strtolower($child->localName ?? '');

            if (in_array($name, self::SKIPPED, true)) {
                continue;
            }

            $own = $this->style($child, $rules);

            if (in_array($name, self::CONTAINERS, true)) {
                $this->walk($child, $own, $inherited, $opacity, $rules, $shapes, $images, $depth + 1);

                continue;
            }

            $fill = $own['fill'] ?? $inherited['fill'];
            $fillOpacity = $this->number($own['fill-opacity'] ?? $inherited['fill-opacity']);
            $effective = $opacity * $this->number($own['opacity'] ?? '1') * $fillOpacity;

            if ($name === 'image') {
                $images[] = new ImageModel(
                    $this->millimetres($child->getAttribute('width')),
                    $this->millimetres($child->getAttribute('height')),
                    $this->altText($child),
                );

                continue;
            }

            if (! isset(self::SHAPES[$name])) {
                continue;
            }

            $kind = self::SHAPES[$name];

            if ($name === 'rect' && ($this->number($child->getAttribute('rx')) > 0.0 || $this->number($child->getAttribute('ry')) > 0.0)) {
                $kind = 'roundrect';
            }

            $shapes[] = new ShapeModel(
                $kind,
                $name === 'line' ? null : $this->fillValue($fill),
                $name === 'line' ? null : round((1 - min(1.0, max(0.0, $effective))) * 100, 2),
                $name === 'text' ? trim($child->textContent) : '',
                $child->getAttribute('id') === '' ? null : $child->getAttribute('id'),
            );
        }
    }

    /**
     * Az elem deklaralt stilusa: megjelenitesi attributumok, majd a stilusfajl, majd a style attributum.
     *
     * @param  array<string, list<array{0: int, 1: CssRule}>>  $rules
     * @return array<string, string>
     */
    private function style(DOMElement $element, array $rules): array
    {
        $style = [];

        foreach (['fill', 'fill-opacity', 'opacity'] as $attribute) {
            if ($element->hasAttribute($attribute)) {
                $style[$attribute] = trim($element->getAttribute($attribute));
            }
        }

        $tag = strtolower($element->localName ?? '');
        $id = $element->getAttribute('id');
        $classes = array_filter(explode(' ', trim($element->getAttribute('class'))), static fn (string $class): bool => $class !== '');
        $candidates = [$tag, '*'];

        if ($id !== '') {
            array_push($candidates, '#'.$id, $tag.'#'.$id);
        }

        foreach ($classes as $class) {
            array_push($candidates, '.'.$class, $tag.'.'.$class);
        }

        $matching = [];

        foreach (array_unique($candidates) as $candidate) {
            foreach ($rules[$candidate] ?? [] as $entry) {
                $matching[$entry[0]] = $entry[1];
            }
        }

        ksort($matching);

        foreach ($matching as $rule) {
            foreach ($rule->declarations as [$name, $value]) {
                if (in_array($name, ['fill', 'fill-opacity', 'opacity'], true)) {
                    $style[$name] = $value;
                }
            }
        }

        foreach (explode(';', $element->getAttribute('style')) as $part) {
            $colon = strpos($part, ':');

            if ($colon !== false) {
                $name = strtolower(trim(substr($part, 0, $colon)));

                if (in_array($name, ['fill', 'fill-opacity', 'opacity'], true)) {
                    $style[$name] = trim(substr($part, $colon + 1));
                }
            }
        }

        return $style;
    }

    private function fillValue(string $fill): ?string
    {
        $lower = strtolower(trim($fill));

        return match (true) {
            $lower === 'none' || $lower === 'transparent' => 'none',
            str_starts_with($lower, 'url(') => 'gradient',
            default => CssColors::parse($lower),
        };
    }

    private function number(string $value): float
    {
        $value = trim($value);

        if (str_ends_with($value, '%')) {
            return (float) rtrim($value, '%') / 100;
        }

        return is_numeric($value) ? (float) $value : 0.0;
    }

    private function millimetres(string $value): ?float
    {
        if (preg_match('/^\s*(-?\d*\.?\d+)\s*(px|pt|pc|mm|cm|in)?\s*$/i', $value, $match) !== 1) {
            return null;
        }

        return (float) $match[1] * self::MM_PER_UNIT[strtolower($match[2] ?? '')];
    }

    private function altText(DOMElement $image): ?string
    {
        foreach ($image->childNodes as $child) {
            if ($child instanceof DOMElement && in_array(strtolower($child->localName ?? ''), ['title', 'desc'], true)) {
                $text = trim($child->textContent);

                if ($text !== '') {
                    return $text;
                }
            }
        }

        $label = trim($image->getAttribute('aria-label'));

        return $label === '' ? null : $label;
    }
}
