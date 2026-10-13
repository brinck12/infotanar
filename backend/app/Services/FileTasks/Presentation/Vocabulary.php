<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Presentation;

use App\Services\FileTasks\Grammar\Text;

/**
 * A bemutato- es vektorvizsgalatok kozos szokincse: alakzattipusok, animacios
 * effektusok, valtasi effektusok es inditasok, magyar es angol nevekkel.
 *
 * Mindenhol ket irany van: a `normalise*` az elvart ertek (vagy a fajlban
 * talalt nev) szabvanyos kulcsa, a `*Label` a diaknak mutatott magyar nev.
 * A kulcsok kisbetus ASCII szavak alahuzassal.
 */
final class Vocabulary
{
    /** @var array<string, array{0: string, 1: list<string>}> kulcs => [magyar nev, alnevek] */
    private const KINDS = [
        'rect' => ['téglalap', ['rect', 'rectangle']],
        'roundrect' => ['lekerekített téglalap', ['roundrect', 'rounded rectangle', 'round rectangle']],
        'ellipse' => ['ellipszis', ['ellipse', 'oval', 'circle', 'kör']],
        'triangle' => ['háromszög', ['triangle']],
        'diamond' => ['rombusz', ['diamond']],
        'star' => ['csillag', ['star']],
        'line' => ['vonal', ['line', 'egyenes']],
        'arrow' => ['nyíl', ['arrow']],
        'polyline' => ['törtvonal', ['polyline']],
        'polygon' => ['sokszög', ['polygon']],
        'path' => ['szabadkézi alakzat', ['path', 'freeform', 'útvonal']],
        'text' => ['szöveg', ['text']],
        'textbox' => ['szövegdoboz', ['textbox', 'text box']],
        'picture' => ['kép', ['picture', 'image', 'pic', 'ábra']],
        'table' => ['táblázat', ['table']],
        'chart' => ['diagram', ['chart']],
        'group' => ['csoport', ['group']],
        'title' => ['cím', ['title', 'címsor']],
        'placeholder' => ['helyőrző', ['placeholder']],
        'other' => ['egyéb', ['other']],
    ];

    /** @var array<string, array{0: string, 1: list<string>}> kulcs => [magyar nev, alnevek] */
    private const EFFECTS = [
        'appear' => ['megjelenés', ['appear', 'disappear', 'eltűnés']],
        'fly_in' => ['beúszás', ['fly in', 'fly', 'fly out', 'beúsztatás', 'kiúszás']],
        'fade' => ['áttűnés', ['fade', 'fade in', 'fade out', 'elhalványítás', 'halvány']],
        'wipe' => ['letörlés', ['wipe', 'törlés']],
        'zoom' => ['nagyítás', ['zoom']],
        'split' => ['szétválás', ['split']],
        'blinds' => ['zsalu', ['blinds']],
        'box' => ['doboz', ['box']],
        'checkerboard' => ['sakktábla', ['checkerboard']],
        'circle' => ['kör', ['circle']],
        'diamond' => ['rombusz', ['diamond']],
        'dissolve' => ['feloldás', ['dissolve', 'dissolve in', 'dissolve out']],
        'wheel' => ['kerék', ['wheel']],
        'wedge' => ['szelet', ['wedge']],
        'strips' => ['csíkok', ['strips']],
        'stretch' => ['nyújtás', ['stretch']],
        'swivel' => ['forgatás', ['swivel']],
        'bounce' => ['pattogás', ['bounce']],
        'spin' => ['pörgetés', ['spin']],
        'grow_shrink' => ['nagyítás/kicsinyítés', ['grow shrink', 'grow/shrink', 'grow and shrink']],
        'pulse' => ['pulzálás', ['pulse']],
        'teeter' => ['billegés', ['teeter']],
        'transparency' => ['átlátszóság', ['transparency']],
        'path' => ['mozgáspálya', ['motion path', 'path', 'pálya']],
    ];

    /** @var array<string, array{0: string, 1: list<string>}> kulcs => [magyar nev, alnevek] */
    private const TRANSITIONS = [
        'none' => ['nincs', ['none', 'no', 'semmi', 'cut', 'vágás']],
        'fade' => ['áttűnés', ['fade', 'elhalványítás']],
        'push' => ['eltolás', ['push']],
        'wipe' => ['letörlés', ['wipe', 'törlés']],
        'split' => ['szétválás', ['split']],
        'cover' => ['takarás', ['cover']],
        'uncover' => ['felfedés', ['uncover', 'pull']],
        'dissolve' => ['feloldás', ['dissolve']],
        'blinds' => ['zsalu', ['blinds']],
        'checker' => ['sakktábla', ['checker', 'checkerboard']],
        'circle' => ['kör', ['circle']],
        'comb' => ['fésű', ['comb']],
        'diamond' => ['rombusz', ['diamond']],
        'plus' => ['plusz', ['plus']],
        'random' => ['véletlen', ['random']],
        'randombar' => ['véletlen sávok', ['randombar', 'random bars']],
        'strips' => ['csíkok', ['strips']],
        'wedge' => ['szelet', ['wedge']],
        'wheel' => ['kerék', ['wheel']],
        'zoom' => ['nagyítás', ['zoom']],
        'newsflash' => ['hírvillanás', ['newsflash']],
        'vortex' => ['örvény', ['vortex']],
    ];

    /** @var array<string, array{0: string, 1: list<string>}> kulcs => [magyar nev, alnevek] */
    private const TRIGGERS = [
        'click' => ['kattintásra', ['click', 'on click', 'on_click', 'kattintás']],
        'with' => ['az előzővel együtt', ['with', 'with previous', 'előzővel', 'előzővel egyidőben', 'az előzővel egyidőben']],
        'after' => ['az előző után', ['after', 'after previous', 'előző után']],
    ];

    /** A prstGeom (pptx) alakzatnevehez tartozo kulcs. */
    public static function kindOfPreset(string $preset): string
    {
        $lower = strtolower($preset);

        return match (true) {
            $lower === 'rect' => 'rect',
            str_contains($lower, 'round') && str_contains($lower, 'rect') => 'roundrect',
            $lower === 'ellipse' => 'ellipse',
            $lower === 'triangle' || $lower === 'rttriangle' => 'triangle',
            $lower === 'diamond' => 'diamond',
            str_starts_with($lower, 'star') => 'star',
            $lower === 'line' || str_contains($lower, 'connector') => 'line',
            str_contains($lower, 'arrow') => 'arrow',
            default => 'other',
        };
    }

    /** Az ODF `draw:enhanced-geometry` tipusahoz tartozo kulcs. */
    public static function kindOfOdfGeometry(string $type): string
    {
        $lower = strtolower($type);

        return match (true) {
            $lower === 'rectangle' => 'rect',
            str_contains($lower, 'round') && str_contains($lower, 'rect') => 'roundrect',
            $lower === 'ellipse' => 'ellipse',
            str_contains($lower, 'triangle') => 'triangle',
            $lower === 'diamond' => 'diamond',
            str_contains($lower, 'star') => 'star',
            str_contains($lower, 'arrow') => 'arrow',
            default => 'other',
        };
    }

    public static function normaliseKind(string $text): ?string
    {
        return self::lookup(self::KINDS, $text);
    }

    public static function kindLabel(string $kind): string
    {
        return self::KINDS[$kind][0] ?? self::KINDS['other'][0];
    }

    /** @return list<string> */
    public static function kindKeys(): array
    {
        return array_keys(self::KINDS);
    }

    public static function normaliseEffect(string $text): ?string
    {
        return self::lookup(self::EFFECTS, $text);
    }

    /** A fajlban talalt effektusnev kulcsa; ismeretlen nevnel a nev maga (kisbetus, alahuzassal). */
    public static function effectKeyOf(string $name): string
    {
        $key = self::squash($name);
        $known = self::lookup(self::EFFECTS, $name);

        return $known ?? (trim((string) preg_replace('/[^a-z0-9]+/', '_', strtolower($name)), '_') ?: $key);
    }

    public static function effectLabel(string $effect): string
    {
        return self::EFFECTS[$effect][0] ?? str_replace('_', ' ', $effect);
    }

    public static function normaliseTransition(string $text): ?string
    {
        return self::lookup(self::TRANSITIONS, $text);
    }

    public static function transitionKeyOf(string $name): string
    {
        $known = self::lookup(self::TRANSITIONS, $name);

        return $known ?? trim((string) preg_replace('/[^a-z0-9]+/', '_', strtolower($name)), '_');
    }

    public static function transitionLabel(string $transition): string
    {
        return self::TRANSITIONS[$transition][0] ?? str_replace('_', ' ', $transition);
    }

    public static function normaliseTrigger(string $text): ?string
    {
        return self::lookup(self::TRIGGERS, $text);
    }

    public static function triggerLabel(string $trigger): string
    {
        return self::TRIGGERS[$trigger][0] ?? $trigger;
    }

    /**
     * @param  array<string, array{0: string, 1: list<string>}>  $table
     */
    private static function lookup(array $table, string $text): ?string
    {
        $needle = self::squash($text);

        if ($needle === '') {
            return null;
        }

        foreach ($table as $key => [$label, $aliases]) {
            foreach ([$key, $label, ...$aliases] as $candidate) {
                if (self::squash($candidate) === $needle) {
                    return $key;
                }
            }
        }

        return null;
    }

    /** Kisbetu, ekezet es elvalasztok (szokoz, alahuzas, kotojel) nelkul. */
    private static function squash(string $text): string
    {
        return (string) preg_replace('/[\s_\-]+/', '', Text::fold($text));
    }
}
