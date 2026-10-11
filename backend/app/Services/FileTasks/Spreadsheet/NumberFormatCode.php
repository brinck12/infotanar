<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Spreadsheet;

use App\Services\FileTasks\Grammar\Text;

/**
 * Szamformatum-kod osszehasonlithato (kanonikus) alakban.
 *
 * Ugyanaz a formatum sokfelekeppen irhato le: a fajl angol jelolest tarol
 * ("0.00", "#,##0\ "Ft"", "mm:ss"), a szerzo pedig azt irja be, amit a magyar
 * tablazatkezelo mutat ("0,00", "# ##0 "Ft"", "pp:mm"). A kanonikus alak:
 *  - csak az elso szakasz szamit (a negativ szamok kulon formatuma nem);
 *  - tizedesjel a pont, ezrestagolo a vesszo;
 *  - a datum es az ido betui angolok (y, m, d, h, s);
 *  - az idezett vagy visszaperrel jelolt szoveg sima szoveg, a szin, a
 *    feltetel, a nyelvi kod es a helykitolto jelek kimaradnak;
 *  - kisbetus, a szokozok osszevonva.
 *
 * Az elvart ertek lehet formatumcsalad neve is (általános, szám, szöveg,
 * százalék, pénznem, dátum, idő): akkor nem a kod, hanem a fajtaja szamit.
 */
final readonly class NumberFormatCode
{
    public const GENERAL = 'General';

    private const KIND_GENERAL = 'general';

    private const KIND_NUMBER = 'number';

    private const KIND_DATE = 'date';

    private const KIND_TEXT = 'text';

    /** Az "Altalanos" formatum nevei a fajlokban es a feluleteken. */
    private const GENERAL_NAMES = ['general', 'altalanos', 'standard', 'normal'];

    /** Magyar datum- es idobetuk => angol megfelelojuk (csak akkor, ha a kod magyar jelolesu). */
    private const HUNGARIAN_LETTERS = ['é' => 'y', 'h' => 'm', 'n' => 'd', 'ó' => 'h', 'p' => 'm', 'm' => 's'];

    /** Delelott/delutan jelolok: a betuik nem datumbetuk. */
    private const MERIDIEM = ['am/pm', 'a/p', 'de./du.', 'de/du'];

    private const MERIDIEM_TOKEN = '~';

    private const CURRENCY_SYMBOLS = ['ft', 'huf', '€', 'eur', '$', 'usd', '£', 'gbp'];

    /** Az xlsx beepitett formatumai: ezekhez a fajl nem tarol kodot (ECMA-376 18.8.30). */
    private const BUILTIN = [
        0 => self::GENERAL, 1 => '0', 2 => '0.00', 3 => '#,##0', 4 => '#,##0.00',
        9 => '0%', 10 => '0.00%', 11 => '0.00E+00', 12 => '# ?/?', 13 => '# ??/??',
        // A 14-es a teruleti beallitas rovid datuma; magyar gepen ev.honap.nap.
        14 => 'yyyy.mm.dd', 15 => 'd-mmm-yy', 16 => 'd-mmm', 17 => 'mmm-yy',
        18 => 'h:mm AM/PM', 19 => 'h:mm:ss AM/PM', 20 => 'h:mm', 21 => 'h:mm:ss', 22 => 'yyyy.mm.dd h:mm',
        37 => '#,##0', 38 => '#,##0', 39 => '#,##0.00', 40 => '#,##0.00',
        45 => 'mm:ss', 46 => '[h]:mm:ss', 47 => 'mm:ss.0', 48 => '##0.0E+0', 49 => '@',
    ];

    private function __construct(
        public string $canonical,
        private string $kind,
        /** A kanonikus alak a feliratok eredeti kis- es nagybetuivel ("#,##0 Ft"), megjeleniteshez. */
        private string $display,
    ) {}

    public static function parse(string $code): self
    {
        $code = trim($code);

        if ($code === '' || in_array(Text::fold($code), self::GENERAL_NAMES, true)) {
            return new self(self::KIND_GENERAL, self::KIND_GENERAL, self::GENERAL);
        }

        $segments = self::segments($code);
        $pattern = mb_strtolower(implode('', array_map(
            static fn (array $segment): string => $segment[0] ? '' : $segment[1],
            $segments,
        )), 'UTF-8');

        $kind = match (true) {
            preg_match('/[0#?]/', $pattern) === 1 => self::KIND_NUMBER,
            str_contains($pattern, '@') => self::KIND_TEXT,
            preg_match('/[ymdhséónp]/u', $pattern) === 1 => self::KIND_DATE,
            default => self::KIND_TEXT,
        };

        $transform = match ($kind) {
            self::KIND_NUMBER => self::numericTransform($pattern),
            self::KIND_DATE => self::dateTransform($pattern),
            default => static fn (string $text): string => $text,
        };

        $display = '';

        foreach ($segments as [$literal, $text]) {
            $display .= $literal ? $text : $transform(mb_strtolower($text, 'UTF-8'));
        }

        $display = trim((string) preg_replace('/[\s\x{00A0}\x{202F}]+/u', ' ', $display));

        if ($kind === self::KIND_DATE) {
            // "yyyy. mm. dd." es "yyyy.mm.dd" ugyanaz a formatum.
            $display = rtrim(str_replace(' ', '', $display), '.');
        }

        return new self(mb_strtolower($display, 'UTF-8'), $kind, $display);
    }

    /** Az xlsx `numFmtId` beepitett kodja; ismeretlen azonositonal Altalanos. */
    public static function builtin(int $id): string
    {
        return self::BUILTIN[$id] ?? self::GENERAL;
    }

    /** Megfelel-e a formatum a szerzo altal elvartnak (kod vagy formatumcsalad). */
    public function matches(string $expected): bool
    {
        return match (Text::fold($expected)) {
            'altalanos', 'general' => $this->kind === self::KIND_GENERAL,
            'szoveg', 'text' => $this->canonical === '@',
            'szazalek', 'percent' => $this->isPercent(),
            'penznem', 'currency' => $this->isCurrency(),
            'szam', 'number' => $this->kind === self::KIND_NUMBER && ! $this->isPercent() && ! $this->isCurrency(),
            'datum', 'date' => $this->hasDate(),
            'ido', 'time' => $this->hasTime() && ! $this->hasDate(),
            default => self::parse($expected)->canonical === $this->canonical,
        };
    }

    public function isDateTime(): bool
    {
        return $this->kind === self::KIND_DATE;
    }

    public function hasDate(): bool
    {
        if ($this->kind !== self::KIND_DATE) {
            return false;
        }

        $letters = $this->dateLetters();

        return preg_match('/[yd]/', $letters) === 1 || (str_contains($letters, 'm') && ! $this->hasTime());
    }

    public function hasTime(): bool
    {
        return $this->kind === self::KIND_DATE && preg_match('/[hs]/', $this->dateLetters()) === 1;
    }

    /** A formatum ugy, ahogy a magyar tablazatkezelo mutatja (a diaknak szolo `found` szoveghez). */
    public function label(): string
    {
        return match ($this->kind) {
            self::KIND_GENERAL => 'Általános',
            self::KIND_DATE => $this->hungarianDate(),
            default => strtr($this->display, [',' => ' ', '.' => ',']),
        };
    }

    private function isPercent(): bool
    {
        return $this->kind === self::KIND_NUMBER && str_contains($this->canonical, '%');
    }

    private function isCurrency(): bool
    {
        if ($this->kind !== self::KIND_NUMBER) {
            return false;
        }

        foreach (self::CURRENCY_SYMBOLS as $symbol) {
            if (str_contains($this->canonical, $symbol)) {
                return true;
            }
        }

        return false;
    }

    /** A kanonikus datumkod a delelott/delutan jelolo nelkul (annak a betui nem datumbetuk). */
    private function dateLetters(): string
    {
        return str_replace(self::MERIDIEM, '', $this->canonical);
    }

    /**
     * A kod elso szakasza darabokra bontva: [szoveg-e, tartalom]. A szoveges
     * darab idezett vagy visszaperrel jelolt felirat, a tobbi formatumjel.
     *
     * @return list<array{0: bool, 1: string}>
     */
    private static function segments(string $code): array
    {
        $characters = mb_str_split($code, 1, 'UTF-8');
        $count = count($characters);
        $segments = [];
        $pattern = '';

        $flush = static function () use (&$segments, &$pattern): void {
            if ($pattern !== '') {
                $segments[] = [false, $pattern];
                $pattern = '';
            }
        };

        for ($index = 0; $index < $count; $index++) {
            $character = $characters[$index];

            if ($character === ';') {
                // A tovabbi szakaszok (negativ szam, nulla, szoveg) nem szamitanak.
                break;
            }

            if ($character === '"') {
                $literal = '';

                for ($index++; $index < $count && $characters[$index] !== '"'; $index++) {
                    $literal .= $characters[$index];
                }

                $flush();
                $segments[] = [true, $literal];
            } elseif ($character === '\\') {
                $flush();
                $segments[] = [true, $characters[++$index] ?? ''];
            } elseif ($character === '_' || $character === '*') {
                // Helykihagyo es kitolto jel: a kovetkezo karakterrel egyutt csak a megjelenest igazitja.
                $index++;
            } elseif ($character === '[') {
                $content = '';

                for ($index++; $index < $count && $characters[$index] !== ']'; $index++) {
                    $content .= $characters[$index];
                }

                if (str_starts_with($content, '$')) {
                    // Penznem es nyelvi kod: [$Ft-40E] => "Ft", [$-40E] => semmi.
                    $flush();
                    $segments[] = [true, explode('-', substr($content, 1), 2)[0]];
                } elseif (preg_match('/^(h+|m+|s+|ó+|p+)$/iu', $content) === 1) {
                    // Eltelt ido ([h]:mm): a formatum resze.
                    $pattern .= '['.$content.']';
                }
                // Minden mas szogletes zarojel szin vagy feltetel: kimarad.
            } else {
                $pattern .= $character;
            }
        }

        $flush();

        return $segments;
    }

    /**
     * Szamformatum jeleinek atalakitasa: tizedesjel => pont, ezrestagolo => vesszo.
     *
     * A vesszo szerepet a teljes mintabol dontjuk el: ha szokoz tagol
     * ("# ##0,00"), vagy a vesszo a pont utan all ("#.##0,00"), akkor
     * tizedesjel; egyedul allva csak a "#,##0" alakban ezrestagolo, minden mas
     * esetben ("0,00") tizedesjel.
     *
     * @return callable(string): string
     */
    private static function numericTransform(string $pattern): callable
    {
        $spaceGrouping = '/(?<=[#0?])[ \x{00A0}\x{202F}](?=[#0?])/u';
        $lastComma = strrpos($pattern, ',');
        $lastDot = strrpos($pattern, '.');

        $decimalComma = match (true) {
            preg_match($spaceGrouping, $pattern) === 1 => true,
            $lastComma !== false && $lastDot !== false => $lastComma > $lastDot,
            $lastComma !== false => preg_match('/#,[#0?]{3}(?![#0?])/', $pattern) !== 1,
            default => false,
        };

        return static function (string $text) use ($decimalComma, $spaceGrouping): string {
            if ($decimalComma) {
                $text = strtr($text, ['.' => ',', ',' => '.']);
            }

            return (string) preg_replace($spaceGrouping, ',', $text);
        };
    }

    /**
     * Datum- es idoformatum betuinek angolra valtasa, ha a kod magyar jelolesu
     * (van benne é, ó, n vagy p): "éééé.hh.nn" => "yyyy.mm.dd", "pp:mm" => "mm:ss".
     *
     * @return callable(string): string
     */
    private static function dateTransform(string $pattern): callable
    {
        $hungarian = preg_match('/[éónp]/u', str_replace(self::MERIDIEM, '', $pattern)) === 1;

        return static function (string $text) use ($hungarian): string {
            $text = str_replace(self::MERIDIEM, self::MERIDIEM_TOKEN, $text);

            if ($hungarian) {
                $text = strtr($text, self::HUNGARIAN_LETTERS);
            }

            return str_replace(self::MERIDIEM_TOKEN, 'am/pm', $text);
        };
    }

    /** A kanonikus (angol) datumkod magyar betukkel: a perc `p`, a honap `h`, a masodperc `m`. */
    private function hungarianDate(): string
    {
        $runs = preg_split('/((?:am\/pm)|y+|m+|d+|h+|s+)/', $this->canonical, -1, PREG_SPLIT_DELIM_CAPTURE | PREG_SPLIT_NO_EMPTY);
        $runs = $runs === false ? [] : $runs;
        $letters = array_values(array_filter($runs, static fn (string $run): bool => preg_match('/^[ymdhs]+$/', $run) === 1));
        $position = 0;
        $label = '';

        foreach ($runs as $run) {
            if (preg_match('/^[ymdhs]+$/', $run) !== 1) {
                $label .= $run === 'am/pm' ? 'de./du.' : $run;

                continue;
            }

            $previous = $letters[$position - 1][0] ?? '';
            $next = $letters[$position + 1][0] ?? '';
            $position++;

            $letter = match ($run[0]) {
                'y' => 'é',
                'd' => 'n',
                'h' => 'ó',
                's' => 'm',
                // Az `m` perc, ha ora utan vagy masodperc elott all; kulonben honap.
                default => $previous === 'h' || $next === 's' ? 'p' : 'h',
            };

            $label .= str_repeat($letter, strlen($run));
        }

        return $label;
    }
}
