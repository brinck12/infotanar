<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Presentation;

use App\Services\FileTasks\Grammar\Lengths;
use App\Services\FileTasks\UnreadableFile;
use DOMElement;

/**
 * Az odp (OpenDocument Presentation) csomag ertelmezese PresentationModel-le.
 * Ugyanazt olvassa, mint a PptxParser: meret, hatter, valtas, cimmeret,
 * alakzatok, animaciok, a minta betutipusai es az ismetles.
 */
final readonly class OdpParser
{
    private const NS = [
        'office' => 'urn:oasis:names:tc:opendocument:xmlns:office:1.0',
        'style' => 'urn:oasis:names:tc:opendocument:xmlns:style:1.0',
        'text' => 'urn:oasis:names:tc:opendocument:xmlns:text:1.0',
        'draw' => 'urn:oasis:names:tc:opendocument:xmlns:drawing:1.0',
        'presentation' => 'urn:oasis:names:tc:opendocument:xmlns:presentation:1.0',
        'fo' => 'urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0',
        'svg' => 'urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0',
        'smil' => 'urn:oasis:names:tc:opendocument:xmlns:smil-compatible:1.0',
        'anim' => 'urn:oasis:names:tc:opendocument:xmlns:animation:1.0',
        'table' => 'urn:oasis:names:tc:opendocument:xmlns:table:1.0',
        'xlink' => 'http://www.w3.org/1999/xlink',
    ];

    private const MAX_SLIDES = 500;

    /** A draw:page gyermekei kozul az alakzatok (helyi nev => alapertelmezett fajta). */
    private const SHAPES = [
        'frame' => 'other',
        'custom-shape' => 'other',
        'rect' => 'rect',
        'ellipse' => 'ellipse',
        'circle' => 'ellipse',
        'line' => 'line',
        'connector' => 'line',
        'polygon' => 'polygon',
        'polyline' => 'polyline',
        'path' => 'path',
        'g' => 'group',
        'caption' => 'textbox',
        'measure' => 'line',
        'regular-polygon' => 'polygon',
    ];

    private const FILLS = ['solid' => 'solid', 'gradient' => 'gradient', 'bitmap' => 'image', 'hatch' => 'pattern', 'none' => 'none'];

    private const TRIGGERS = ['on-click' => 'click', 'with-previous' => 'with', 'after-previous' => 'after'];

    private const CLASSES = ['entrance' => 'entrance', 'exit' => 'exit', 'emphasis' => 'emphasis', 'motion-path' => 'path'];

    /** smil:type => a Vocabulary valtas-kulcsa, ahol a nevek elternek. */
    private const SMIL_TRANSITIONS = [
        'pushwipe' => 'push', 'slidewipe' => 'cover', 'barwipe' => 'wipe', 'blindswipe' => 'blinds',
        'checkerboardwipe' => 'checker', 'ellipsewipe' => 'circle', 'iriswipe' => 'circle', 'diamondwipe' => 'diamond',
        'fade' => 'fade', 'dissolve' => 'dissolve', 'zoom' => 'zoom', 'miscshapewipe' => 'random',
        'randombarwipe' => 'randombar', 'snakewipe' => 'wipe', 'waterfallwipe' => 'wipe', 'clockwipe' => 'wheel',
        'fanwipe' => 'wedge', 'doublefanwipe' => 'wedge', 'singlesweepwipe' => 'wipe', 'boxwipe' => 'wipe',
        'veewipe' => 'wipe', 'bowtiewipe' => 'wipe', 'trianglewipe' => 'wipe', 'arrowheadwipe' => 'wipe',
        'pentagonwipe' => 'wipe', 'hexagonwipe' => 'wipe', 'starwipe' => 'wipe', 'fourboxwipe' => 'wipe',
        'eyewipe' => 'wipe', 'roundrectwipe' => 'wipe', 'heartwipe' => 'wipe', 'parallelsnakeswipe' => 'wipe',
        'spiralwipe' => 'wipe', 'zigzagwipe' => 'wipe', 'barnzigzagwipe' => 'wipe', 'bardoorwipe' => 'wipe',
    ];

    public function parse(OoxmlPackage $package): PresentationModel
    {
        $content = $package->document('content.xml') ?? throw new UnreadableFile('Hianyzik a content.xml.');
        $stylesDocument = $package->document('styles.xml');
        $styles = new OdfStyles;

        if ($stylesDocument !== null) {
            $styles->add($stylesDocument);
        }

        $styles->add($content);

        $xp = Xp::for($content, self::NS);
        $stylesXp = $stylesDocument === null ? null : Xp::for($stylesDocument, self::NS);
        $pages = $xp->elements('/office:document-content/office:body/office:presentation/draw:page');

        if (count($pages) > self::MAX_SLIDES) {
            throw new UnreadableFile('Tul sok dia.');
        }

        $firstMaster = $pages === [] ? '' : $pages[0]->getAttributeNS(self::NS['draw'], 'master-page-name');
        [$width, $height] = $this->size($stylesXp, $firstMaster);
        $slides = [];

        foreach ($pages as $index => $page) {
            $slides[] = $this->slide($index + 1, $page, $xp, $styles, $stylesXp);
        }

        [$titleFont, $bodyFont] = $this->fonts($styles, $firstMaster);

        return new PresentationModel(
            $width,
            $height,
            $slides,
            $titleFont,
            $bodyFont,
            $xp->string('//presentation:settings/@presentation:endless') === 'true',
        );
    }

    /** @return array{0: float, 1: float} szelesseg, magassag mm-ben */
    private function size(?Xp $stylesXp, string $masterName): array
    {
        if ($stylesXp === null) {
            throw new UnreadableFile('Hianyzik a styles.xml.');
        }

        $master = $masterName === ''
            ? $stylesXp->element('//style:master-page')
            : $stylesXp->element("//style:master-page[@style:name='".$this->quote($masterName)."']") ?? $stylesXp->element('//style:master-page');
        $layoutName = $master === null ? '' : $master->getAttributeNS(self::NS['style'], 'page-layout-name');
        $layout = $stylesXp->element("//style:page-layout[@style:name='".$this->quote($layoutName)."']/style:page-layout-properties");
        $width = $layout === null ? null : Lengths::toMillimetres($layout->getAttributeNS(self::NS['fo'], 'page-width'));
        $height = $layout === null ? null : Lengths::toMillimetres($layout->getAttributeNS(self::NS['fo'], 'page-height'));

        if ($width === null || $height === null || $width <= 0.0 || $height <= 0.0) {
            throw new UnreadableFile('A diameret nem olvashato.');
        }

        return [$width, $height];
    }

    private function slide(int $number, DOMElement $page, Xp $xp, OdfStyles $styles, ?Xp $stylesXp): SlideModel
    {
        $pageStyle = $page->getAttributeNS(self::NS['draw'], 'style-name');
        $masterName = $page->getAttributeNS(self::NS['draw'], 'master-page-name');
        $masterStyle = $stylesXp === null || $masterName === ''
            ? ''
            : $stylesXp->string("//style:master-page[@style:name='".$this->quote($masterName)."']/@draw:style-name");

        $shapes = [];
        $title = null;

        foreach ($page->childNodes as $child) {
            if (! $child instanceof DOMElement || $child->namespaceURI !== self::NS['draw'] || ! isset(self::SHAPES[$child->localName])) {
                continue;
            }

            $shapes[] = $this->shape($child, $xp, $styles, $number);

            if ($title === null && $child->getAttributeNS(self::NS['presentation'], 'class') === 'title') {
                $title = $child;
            }
        }

        $fill = $this->pageFill($styles, $pageStyle) ?? $this->pageFill($styles, $masterStyle) ?? ['type' => 'solid', 'color' => 'FFFFFF'];

        return new SlideModel(
            $number,
            $fill['type'],
            $fill['color'],
            $this->transition($styles, $pageStyle),
            $title === null ? null : $this->titleSize($title, $xp, $styles),
            $title !== null,
            $shapes,
            $this->animations($page, $xp),
        );
    }

    /** @return array{type: string, color: string|null}|null */
    private function pageFill(OdfStyles $styles, string $style): ?array
    {
        $fill = $styles->lookup('drawing-page', $style, 'fill');

        if ($fill === null || ! isset(self::FILLS[$fill])) {
            return null;
        }

        $type = self::FILLS[$fill];
        $color = $type === 'solid' ? $this->hex($styles->lookup('drawing-page', $style, 'fill-color')) : null;

        return ['type' => $type, 'color' => $color];
    }

    private function transition(OdfStyles $styles, string $style): string
    {
        $type = $styles->lookup('drawing-page', $style, 'type');

        if ($type !== null && $type !== '') {
            $key = strtolower($type);

            return self::SMIL_TRANSITIONS[$key] ?? Vocabulary::transitionKeyOf($type);
        }

        $legacy = $styles->lookup('drawing-page', $style, 'transition-style');

        if ($legacy === null || $legacy === '' || $legacy === 'none') {
            return 'none';
        }

        return Vocabulary::transitionKeyOf((string) preg_replace('/-(from|to)-.*$/', '', $legacy));
    }

    private function shape(DOMElement $element, Xp $xp, OdfStyles $styles, int $slide): ShapeModel
    {
        $id = $element->getAttributeNS(self::NS['draw'], 'id');
        $id = $id !== '' ? $id : $element->getAttributeNS('http://www.w3.org/XML/1998/namespace', 'id');
        $id = $id === '' ? null : $id;
        $text = $this->text($element, $xp);
        $kind = self::SHAPES[$element->localName] ?? 'other';
        $image = null;

        if ($element->localName === 'frame') {
            [$kind, $image] = $this->frame($element, $xp, $slide);
        } elseif ($element->localName === 'custom-shape') {
            $geometry = $xp->string('draw:enhanced-geometry/@draw:type', $element);
            $kind = $geometry === '' ? 'other' : Vocabulary::kindOfOdfGeometry($geometry);
        } elseif ($element->localName === 'rect' && $element->getAttributeNS(self::NS['draw'], 'corner-radius') !== '') {
            $radius = Lengths::toMillimetres($element->getAttributeNS(self::NS['draw'], 'corner-radius'));
            $kind = $radius !== null && $radius > 0.0 ? 'roundrect' : 'rect';
        }

        if ($element->getAttributeNS(self::NS['presentation'], 'class') === 'title') {
            $kind = 'title';
        }

        [$fill, $transparency] = $this->fill($element, $styles);

        return new ShapeModel($kind, $kind === 'picture' ? null : $fill, $kind === 'picture' ? null : $transparency, $text, $id, $image);
    }

    /** @return array{0: string, 1: ImageModel|null} */
    private function frame(DOMElement $frame, Xp $xp, int $slide): array
    {
        if ($xp->exists('draw:image', $frame)) {
            $alt = trim($xp->string('svg:desc', $frame));
            $alt = $alt !== '' ? $alt : trim($xp->string('svg:title', $frame));

            return ['picture', new ImageModel(
                Lengths::toMillimetres($frame->getAttributeNS(self::NS['svg'], 'width')),
                Lengths::toMillimetres($frame->getAttributeNS(self::NS['svg'], 'height')),
                $alt === '' ? null : $alt,
                $slide,
            )];
        }

        if ($xp->exists('table:table', $frame)) {
            return ['table', null];
        }

        if ($xp->exists('draw:object | draw:object-ole', $frame)) {
            return ['chart', null];
        }

        if ($xp->exists('draw:text-box', $frame)) {
            return [$frame->getAttributeNS(self::NS['presentation'], 'class') === '' ? 'textbox' : 'placeholder', null];
        }

        return ['other', null];
    }

    /** @return array{0: string|null, 1: float|null} kitoltes, atlatszosag % */
    private function fill(DOMElement $element, OdfStyles $styles): array
    {
        $pairs = [
            ['graphic', $element->getAttributeNS(self::NS['draw'], 'style-name')],
            ['presentation', $element->getAttributeNS(self::NS['presentation'], 'style-name')],
        ];

        foreach ($pairs as [$family, $name]) {
            if ($name === '') {
                continue;
            }

            $fill = $styles->lookup($family, $name, 'fill');

            if ($fill === null || ! isset(self::FILLS[$fill])) {
                continue;
            }

            $type = self::FILLS[$fill];
            $value = $type === 'solid' ? $this->hex($styles->lookup($family, $name, 'fill-color')) : $type;
            $opacity = $styles->lookup($family, $name, 'opacity');
            $transparency = $opacity !== null && preg_match('/^(\d+(?:\.\d+)?)%$/', $opacity, $match) === 1
                ? round(100 - (float) $match[1], 2)
                : null;

            return [$value, $transparency];
        }

        return [null, null];
    }

    private function titleSize(DOMElement $title, Xp $xp, OdfStyles $styles): ?float
    {
        $span = $xp->element('.//text:span[@text:style-name]', $title);
        $paragraph = $xp->element('.//text:p[@text:style-name]', $title);
        $sizes = [];

        if ($span !== null) {
            $sizes[] = $styles->lookup('text', $span->getAttributeNS(self::NS['text'], 'style-name'), 'font-size');
        }

        if ($paragraph !== null) {
            $name = $paragraph->getAttributeNS(self::NS['text'], 'style-name');
            $sizes[] = $styles->lookup('paragraph', $name, 'font-size');
            $sizes[] = $styles->lookup('text', $name, 'font-size');
        }

        $sizes[] = $styles->lookup('presentation', $title->getAttributeNS(self::NS['presentation'], 'style-name'), 'font-size');

        foreach ($sizes as $size) {
            if ($size !== null && preg_match('/^(\d+(?:\.\d+)?)pt$/', $size, $match) === 1) {
                return (float) $match[1];
            }
        }

        return null;
    }

    private function text(DOMElement $element, Xp $xp): string
    {
        $paragraphs = [];

        foreach ($xp->elements('.//text:p | .//text:h', $element) as $paragraph) {
            $paragraphs[] = $paragraph->textContent;
        }

        return trim(implode("\n", $paragraphs));
    }

    /** @return list<AnimationModel> */
    private function animations(DOMElement $page, Xp $xp): array
    {
        $animations = [];

        foreach ($xp->elements('.//anim:par[@presentation:preset-id]', $page) as $node) {
            $class = self::CLASSES[$node->getAttributeNS(self::NS['presentation'], 'preset-class')] ?? 'entrance';
            $preset = (string) preg_replace('/^ooo-(entrance|exit|emphasis|motionpath)-/', '', $node->getAttributeNS(self::NS['presentation'], 'preset-id'));
            $effect = $class === 'path' ? 'path' : Vocabulary::effectKeyOf(str_replace('-', '_', $preset));

            $durations = [];

            foreach ($xp->elements('.//*[@smil:dur]', $node) as $timed) {
                $seconds = $this->seconds($timed->getAttributeNS(self::NS['smil'], 'dur'));

                if ($seconds !== null) {
                    $durations[] = $seconds;
                }
            }

            $target = $xp->element('.//*[@smil:targetElement]', $node);
            $targetId = $target === null ? '' : $target->getAttributeNS(self::NS['smil'], 'targetElement');

            $animations[] = new AnimationModel(
                $effect,
                $class,
                self::TRIGGERS[$node->getAttributeNS(self::NS['presentation'], 'node-type')] ?? 'click',
                $durations === [] ? null : max($durations),
                $this->seconds($node->getAttributeNS(self::NS['smil'], 'begin')) ?? 0.0,
                $targetId === '' ? null : $targetId,
            );
        }

        return $animations;
    }

    /** @return array{0: string|null, 1: string|null} cimbetu, szovegbetu */
    private function fonts(OdfStyles $styles, string $masterName): array
    {
        $prefix = $masterName === '' ? null : $masterName.'-';
        $title = $prefix !== null && $styles->has('presentation', $prefix.'title')
            ? $prefix.'title'
            : ($styles->namesEndingWith('presentation', '-title')[0] ?? null);
        $body = $prefix !== null && $styles->has('presentation', $prefix.'outline1')
            ? $prefix.'outline1'
            : ($styles->namesEndingWith('presentation', '-outline1')[0] ?? null);

        return [$this->font($styles, $title), $this->font($styles, $body)];
    }

    private function font(OdfStyles $styles, ?string $name): ?string
    {
        foreach (['presentation', 'graphic'] as $family) {
            foreach (['font-family', 'font-name'] as $property) {
                $value = $styles->lookup($family, $family === 'presentation' ? $name : null, $property);

                if ($value !== null && $value !== '') {
                    return trim($value, "'\" ");
                }
            }
        }

        return null;
    }

    private function hex(?string $color): ?string
    {
        return $color !== null && preg_match('/^#([0-9a-fA-F]{6})$/', $color, $match) === 1 ? strtoupper($match[1]) : null;
    }

    private function seconds(string $value): ?float
    {
        if (preg_match('/^(\d+(?:\.\d+)?)(s|ms)?$/', trim($value), $match) !== 1) {
            return null;
        }

        return ($match[2] ?? 's') === 'ms' ? (float) $match[1] / 1000 : (float) $match[1];
    }

    private function quote(string $value): string
    {
        return str_replace("'", '', $value);
    }
}
