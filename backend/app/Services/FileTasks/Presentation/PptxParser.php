<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Presentation;

use App\Services\FileTasks\UnreadableFile;
use DOMDocument;
use DOMElement;

/**
 * A pptx (PresentationML) csomag ertelmezese PresentationModel-le. Csak a
 * vizsgalatokhoz kello adatokat olvassa: meret, hatter, valtas, cimmeret,
 * alakzatok es animaciok diankent, a minta betutipusai, az ismetles.
 *
 * Csoportok (grpSp) egy alakzatnak szamitanak, a tartalmukat nem bontja ki.
 */
final readonly class PptxParser
{
    private const NS = [
        'p' => 'http://schemas.openxmlformats.org/presentationml/2006/main',
        'a' => 'http://schemas.openxmlformats.org/drawingml/2006/main',
        'r' => 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
        'mc' => 'http://schemas.openxmlformats.org/markup-compatibility/2006',
    ];

    private const EMU_PER_MM = 36000.0;

    private const MAX_SLIDES = 500;

    private const SHAPE_ELEMENTS = ['sp', 'pic', 'graphicFrame', 'grpSp', 'cxnSp'];

    private const FILL_TYPES = [
        'solidFill' => 'solid',
        'gradFill' => 'gradient',
        'blipFill' => 'image',
        'pattFill' => 'pattern',
        'noFill' => 'none',
    ];

    /** Belepo (entrance) es kilepo (exit) effektusok presetID-i. */
    private const PRESETS = [
        1 => 'appear', 2 => 'fly_in', 3 => 'blinds', 4 => 'box', 5 => 'checkerboard', 6 => 'circle',
        8 => 'diamond', 9 => 'dissolve', 10 => 'fade', 16 => 'split', 17 => 'stretch', 18 => 'strips',
        19 => 'swivel', 20 => 'wedge', 21 => 'wheel', 22 => 'wipe', 23 => 'zoom', 26 => 'bounce',
    ];

    private const EMPHASIS_PRESETS = [6 => 'grow_shrink', 8 => 'spin', 9 => 'transparency', 15 => 'pulse', 16 => 'teeter'];

    private const CLASSES = ['entr' => 'entrance', 'exit' => 'exit', 'emph' => 'emphasis', 'path' => 'path'];

    private const TRIGGERS = ['clickEffect' => 'click', 'withEffect' => 'with', 'afterEffect' => 'after'];

    public function parse(OoxmlPackage $package): PresentationModel
    {
        $presentation = $package->document('ppt/presentation.xml') ?? throw new UnreadableFile('Hianyzik a ppt/presentation.xml.');
        $xp = Xp::for($presentation, self::NS);
        $size = $xp->element('/p:presentation/p:sldSz') ?? throw new UnreadableFile('Hianyzik a diameret.');
        $width = (float) $size->getAttribute('cx') / self::EMU_PER_MM;
        $height = (float) $size->getAttribute('cy') / self::EMU_PER_MM;

        if ($width <= 0.0 || $height <= 0.0) {
            throw new UnreadableFile('Ervenytelen diameret.');
        }

        $relationships = $package->relationships('ppt/presentation.xml');
        $paths = [];

        foreach ($xp->elements('/p:presentation/p:sldIdLst/p:sldId') as $slideId) {
            $path = $relationships[$slideId->getAttributeNS(self::NS['r'], 'id')]['path'] ?? null;

            if ($path === null) {
                throw new UnreadableFile('Hibas diakapcsolat.');
            }

            $paths[] = $path;
        }

        if (count($paths) > self::MAX_SLIDES) {
            throw new UnreadableFile('Tul sok dia.');
        }

        $masters = [];
        $slides = [];

        foreach ($paths as $index => $path) {
            $document = $package->document($path) ?? throw new UnreadableFile('Hianyzik egy dia.');
            $layoutPath = $package->relatedPart($path, '/slideLayout');
            $layout = $layoutPath === null ? null : $package->document($layoutPath);
            $masterPath = $layoutPath === null ? null : $package->relatedPart($layoutPath, '/slideMaster');
            $master = null;

            if ($masterPath !== null) {
                $masters[$masterPath] ??= $this->master($package, $masterPath);
                $master = $masters[$masterPath];
            }

            $slides[] = $this->slide($index + 1, $document, $layout, $master);
        }

        if ($masters === []) {
            $masterPath = $package->relatedPart('ppt/presentation.xml', '/slideMaster');

            if ($masterPath !== null) {
                $masters[$masterPath] = $this->master($package, $masterPath);
            }
        }

        $master = $masters === [] ? null : $masters[array_key_first($masters)];
        [$titleFont, $bodyFont] = $master === null ? [null, null] : $this->masterFonts($master);

        return new PresentationModel($width, $height, $slides, $titleFont, $bodyFont, $this->loops($package));
    }

    private function loops(OoxmlPackage $package): bool
    {
        $properties = $package->document('ppt/presProps.xml');

        if ($properties === null) {
            return false;
        }

        $loop = Xp::for($properties, self::NS)->string('//p:showPr/@loop');

        return $loop === '1' || $loop === 'true';
    }

    private function master(OoxmlPackage $package, string $path): PptxMaster
    {
        $document = $package->document($path) ?? throw new UnreadableFile('Hianyzik a dia mintaja.');
        $xp = Xp::for($document, self::NS);
        $themePath = $package->relatedPart($path, '/theme');
        $theme = $themePath === null ? null : $package->document($themePath);
        $colors = [];
        $backgrounds = [];
        $major = null;
        $minor = null;

        if ($theme !== null) {
            $themeXp = Xp::for($theme, self::NS);

            foreach ($themeXp->elements('//a:clrScheme/*') as $color) {
                $value = $themeXp->string('a:srgbClr/@val', $color);
                $value = $value !== '' ? $value : $themeXp->string('a:sysClr/@lastClr', $color);

                if (preg_match('/^[0-9a-fA-F]{6}$/', $value) === 1) {
                    $colors[$color->localName] = strtoupper($value);
                }
            }

            $major = $this->nonEmpty($themeXp->string('//a:fontScheme/a:majorFont/a:latin/@typeface'));
            $minor = $this->nonEmpty($themeXp->string('//a:fontScheme/a:minorFont/a:latin/@typeface'));
            $backgrounds = $themeXp->elements('//a:fmtScheme/a:bgFillStyleLst/*');
        }

        $clrMap = [];
        $map = $xp->element('/p:sldMaster/p:clrMap');

        if ($map !== null) {
            foreach ($map->attributes ?? [] as $attribute) {
                $clrMap[$attribute->nodeName] = $attribute->nodeValue ?? '';
            }
        }

        return new PptxMaster($document, $xp, $colors, $clrMap, $major, $minor, $backgrounds);
    }

    /** @return array{0: string|null, 1: string|null} cimbetu, szovegbetu */
    private function masterFonts(PptxMaster $master): array
    {
        $title = $this->nonEmpty($master->xp->string('/p:sldMaster/p:txStyles/p:titleStyle/a:lvl1pPr/a:defRPr/a:latin/@typeface'));
        $body = $this->nonEmpty($master->xp->string('/p:sldMaster/p:txStyles/p:bodyStyle/a:lvl1pPr/a:defRPr/a:latin/@typeface'));

        return [
            $this->themeFont($title ?? '+mj-lt', $master),
            $this->themeFont($body ?? '+mn-lt', $master),
        ];
    }

    private function themeFont(string $typeface, PptxMaster $master): ?string
    {
        return match ($typeface) {
            '+mj-lt' => $master->majorFont,
            '+mn-lt' => $master->minorFont,
            default => $typeface,
        };
    }

    private function slide(int $number, DOMDocument $document, ?DOMDocument $layout, ?PptxMaster $master): SlideModel
    {
        $xp = Xp::for($document, self::NS);
        $shapes = [];
        $title = null;

        foreach ($xp->elements('/p:sld/p:cSld/p:spTree/*') as $element) {
            if (! in_array($element->localName, self::SHAPE_ELEMENTS, true)) {
                continue;
            }

            $shapes[] = $this->shape($element, $xp, $master, $number);

            if ($title === null && $this->isTitle($element, $xp)) {
                $title = $element;
            }
        }

        $background = $this->background($document, $master)
            ?? ($layout === null ? null : $this->background($layout, $master))
            ?? ($master === null ? null : $this->background($master->document, $master))
            ?? ['type' => 'solid', 'color' => 'FFFFFF'];

        return new SlideModel(
            $number,
            $background['type'],
            $background['color'],
            $this->transition($xp),
            $title === null ? null : $this->titleSize($title, $xp, $layout, $master),
            $title !== null,
            $shapes,
            $this->animations($xp),
            $layout === null ? null : $this->nonEmpty(Xp::for($layout, self::NS)->string('/p:sldLayout/p:cSld/@name')),
        );
    }

    private function isTitle(DOMElement $element, Xp $xp): bool
    {
        return $element->localName === 'sp'
            && in_array($xp->string('p:nvSpPr/p:nvPr/p:ph/@type', $element), ['title', 'ctrTitle'], true);
    }

    private function shape(DOMElement $element, Xp $xp, ?PptxMaster $master, int $slide): ShapeModel
    {
        $id = $this->nonEmpty($xp->string('*[1]/p:cNvPr/@id', $element));
        $colors = $master->colors ?? [];
        $clrMap = $master->clrMap ?? [];

        switch ($element->localName) {
            case 'pic':
                $extent = $xp->element('p:spPr/a:xfrm/a:ext', $element);
                $alt = $this->nonEmpty(trim($xp->string('p:nvPicPr/p:cNvPr/@descr', $element)));
                $image = new ImageModel(
                    $extent === null ? null : (float) $extent->getAttribute('cx') / self::EMU_PER_MM,
                    $extent === null ? null : (float) $extent->getAttribute('cy') / self::EMU_PER_MM,
                    $alt,
                    $slide,
                );

                return new ShapeModel('picture', null, null, '', $id, $image);

            case 'graphicFrame':
                $uri = $xp->string('a:graphic/a:graphicData/@uri', $element);
                $kind = match (true) {
                    str_ends_with($uri, '/table') => 'table',
                    str_ends_with($uri, '/chart') => 'chart',
                    default => 'other',
                };

                return new ShapeModel($kind, null, null, $this->text($element, $xp), $id);

            case 'grpSp':
                return new ShapeModel('group', null, null, '', $id);

            case 'cxnSp':
                return new ShapeModel('line', null, null, '', $id);
        }

        $properties = $xp->element('p:spPr', $element);
        $kind = $this->shapeKind($element, $properties, $xp);
        $fill = $properties === null ? null : $this->fill($properties, $master, null);
        $transparency = $fill['transparency'] ?? null;
        $value = $fill === null ? null : $this->fillValue($fill);

        if ($fill === null) {
            $reference = $xp->element('p:style/a:fillRef', $element);

            if ($reference !== null) {
                if ((int) $reference->getAttribute('idx') === 0) {
                    $value = 'none';
                } else {
                    $color = DrawingColors::resolve($reference, $colors, $clrMap);
                    $value = $color['hex'] ?? null;
                    $transparency = $color['transparency'] ?? null;
                }
            }
        }

        return new ShapeModel($kind, $value, $transparency, $this->text($element, $xp), $id);
    }

    private function shapeKind(DOMElement $element, ?DOMElement $properties, Xp $xp): string
    {
        $placeholder = $xp->element('p:nvSpPr/p:nvPr/p:ph', $element);

        if ($placeholder !== null) {
            return in_array($placeholder->getAttribute('type'), ['title', 'ctrTitle'], true) ? 'title' : 'placeholder';
        }

        if ($xp->string('p:nvSpPr/p:cNvSpPr/@txBox', $element) === '1') {
            return 'textbox';
        }

        $preset = $properties === null ? '' : $xp->string('a:prstGeom/@prst', $properties);

        if ($preset !== '') {
            return Vocabulary::kindOfPreset($preset);
        }

        return $properties !== null && $xp->exists('a:custGeom', $properties) ? 'path' : 'other';
    }

    /**
     * A kitoltes tipusa, szine es atlatszosaga a $holder (spPr, bgPr) elso kitoltes-gyermekebol.
     *
     * @return array{type: string, color: string|null, transparency: float|null}|null
     */
    private function fill(DOMElement $holder, ?PptxMaster $master, ?string $placeholder): ?array
    {
        foreach ($holder->childNodes as $child) {
            if (! $child instanceof DOMElement || ! isset(self::FILL_TYPES[$child->localName])) {
                continue;
            }

            $type = self::FILL_TYPES[$child->localName];
            $color = $type === 'solid'
                ? DrawingColors::resolve($child, $master->colors ?? [], $master->clrMap ?? [], $placeholder)
                : null;

            return ['type' => $type, 'color' => $color['hex'] ?? null, 'transparency' => $color['transparency'] ?? null];
        }

        return null;
    }

    /** @param array{type: string, color: string|null, transparency: float|null} $fill */
    private function fillValue(array $fill): ?string
    {
        return $fill['type'] === 'solid' ? $fill['color'] : $fill['type'];
    }

    /** @return array{type: string, color: string|null}|null */
    private function background(DOMDocument $document, ?PptxMaster $master): ?array
    {
        $xp = Xp::for($document, self::NS);
        $background = $xp->element('/*/p:cSld/p:bg');

        if ($background === null) {
            return null;
        }

        $properties = $xp->element('p:bgPr', $background);

        if ($properties !== null) {
            $fill = $this->fill($properties, $master, null);

            return $fill === null ? null : ['type' => $fill['type'], 'color' => $fill['color']];
        }

        $reference = $xp->element('p:bgRef', $background);

        if ($reference === null) {
            return null;
        }

        $color = DrawingColors::resolve($reference, $master->colors ?? [], $master->clrMap ?? [])['hex'] ?? null;
        $index = (int) $reference->getAttribute('idx') - 1001;
        $style = $master->backgroundStyles[$index] ?? null;

        if ($style === null) {
            return ['type' => 'solid', 'color' => $color];
        }

        $type = self::FILL_TYPES[$style->localName] ?? 'solid';

        return [
            'type' => $type,
            'color' => $type === 'solid' ? (DrawingColors::resolve($style, $master->colors ?? [], $master->clrMap ?? [], $color)['hex'] ?? $color) : null,
        ];
    }

    private function transition(Xp $xp): string
    {
        $transition = $xp->element('//p:transition');

        if ($transition === null) {
            return 'none';
        }

        foreach ($transition->childNodes as $child) {
            if ($child instanceof DOMElement) {
                return Vocabulary::transitionKeyOf($child->localName ?? '');
            }
        }

        return 'none';
    }

    private function titleSize(DOMElement $title, Xp $xp, ?DOMDocument $layout, ?PptxMaster $master): ?float
    {
        $size = $xp->string('p:txBody/a:p/a:r/a:rPr/@sz', $title);

        if ($size === '' && $layout !== null) {
            $size = $this->placeholderSize($layout);
        }

        if ($size === '' && $master !== null) {
            $size = $this->placeholderSize($master->document);
        }

        if ($size === '' && $master !== null) {
            $size = $master->xp->string('/p:sldMaster/p:txStyles/p:titleStyle/a:lvl1pPr/a:defRPr/@sz');
        }

        return preg_match('/^\d+$/', $size) === 1 ? (int) $size / 100 : null;
    }

    private function placeholderSize(DOMDocument $document): string
    {
        return Xp::for($document, self::NS)->string(
            "//p:sp[p:nvSpPr/p:nvPr/p:ph[@type='title' or @type='ctrTitle']]/p:txBody/a:lstStyle/a:lvl1pPr/a:defRPr/@sz",
        );
    }

    private function text(DOMElement $element, Xp $xp): string
    {
        $paragraphs = [];

        foreach ($xp->elements('.//a:p', $element) as $paragraph) {
            $line = '';

            foreach ($xp->elements('.//a:t', $paragraph) as $run) {
                $line .= $run->textContent;
            }

            $paragraphs[] = $line;
        }

        return trim(implode("\n", $paragraphs));
    }

    /** @return list<AnimationModel> */
    private function animations(Xp $xp): array
    {
        $animations = [];

        foreach ($xp->elements('//p:timing//p:cTn[@presetID]') as $node) {
            $class = self::CLASSES[$node->getAttribute('presetClass')] ?? 'entrance';
            $preset = (int) $node->getAttribute('presetID');
            $effect = match ($class) {
                'path' => 'path',
                'emphasis' => self::EMPHASIS_PRESETS[$preset] ?? 'preset_'.$preset,
                default => self::PRESETS[$preset] ?? 'preset_'.$preset,
            };

            $durations = [];

            foreach ($xp->elements('.//p:cBhvr/p:cTn', $node) as $behaviour) {
                $value = $behaviour->getAttribute('dur');

                if (preg_match('/^\d+$/', $value) === 1) {
                    $durations[] = (int) $value / 1000;
                }
            }

            $delay = $xp->string('p:stCondLst/p:cond/@delay', $node);
            $target = $this->nonEmpty($xp->string('.//p:spTgt/@spid', $node));

            $animations[] = new AnimationModel(
                $effect,
                $class,
                self::TRIGGERS[$node->getAttribute('nodeType')] ?? 'click',
                $durations === [] ? null : max($durations),
                preg_match('/^\d+$/', $delay) === 1 ? (int) $delay / 1000 : 0.0,
                $target,
            );
        }

        return $animations;
    }

    private function nonEmpty(string $value): ?string
    {
        return $value === '' ? null : $value;
    }
}
