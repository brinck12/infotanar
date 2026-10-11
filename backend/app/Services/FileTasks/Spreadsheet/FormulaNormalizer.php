<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Spreadsheet;

use App\Services\FileTasks\UnreadableFile;

/**
 * Kepletek egyseges (kanonikus) alakja, hogy az xlsx, az ods es a szerzo
 * altal beirt elvaras osszevetheto legyen.
 *
 * A kanonikus keplet: egyenlosegjel es szokozok nelkul, ANGOL fuggvenynevekkel
 * nagybetuvel, A1 stilusu hivatkozasokkal (`Munka2!$A$1:B5`), vesszovel
 * elvalasztott argumentumokkal, tizedesponttal. Az xlsx eleve igy tarol; az
 * ods OpenFormula jeloleset (`of:=SUM([.A1:.A5];2)`) erre alakitjuk. A magyar
 * fuggvenynevek (a szerzo `fn:SZUM` elvarasa, vagy egy magyar neveket tarolo
 * fajl) a tablazat alapjan valtanak angolra.
 *
 * A kepletet soha nem szamoljuk ki, csak a szoveget elemezzuk.
 */
final class FormulaNormalizer
{
    /** Magyar fuggvenynev => angol. Az elso magyar nev a megjelenitesi alak (localized()). */
    private const FUNCTIONS = [
        'HA' => 'IF', 'HAHIBA' => 'IFERROR', 'HAHIÁNYZIK' => 'IFNA', 'HAELSŐIGAZ' => 'IFS', 'ÁTVÁLT' => 'SWITCH',
        'ÉS' => 'AND', 'VAGY' => 'OR', 'NEM' => 'NOT', 'XVAGY' => 'XOR',
        'SZUM' => 'SUM', 'SZUMHA' => 'SUMIF', 'SZUMHATÖBB' => 'SUMIFS', 'SZORZATÖSSZEG' => 'SUMPRODUCT',
        'ÁTLAG' => 'AVERAGE', 'ÁTLAGHA' => 'AVERAGEIF', 'ÁTLAGHATÖBB' => 'AVERAGEIFS',
        'MAXHA' => 'MAXIFS', 'MINHA' => 'MINIFS',
        'DARAB' => 'COUNT', 'DARAB2' => 'COUNTA', 'DARABÜRES' => 'COUNTBLANK',
        'DARABTELI' => 'COUNTIF', 'DARABHATÖBB' => 'COUNTIFS',
        'NAGY' => 'LARGE', 'KICSI' => 'SMALL', 'MEDIÁN' => 'MEDIAN', 'MÓDUSZ' => 'MODE',
        'SORSZÁM' => 'RANK', 'RANG.EGY' => 'RANK.EQ', 'SZÓRÁS' => 'STDEV',
        'KEREKÍTÉS' => 'ROUND', 'KEREKÍT' => 'ROUND', 'KEREK.FEL' => 'ROUNDUP', 'KEREKFEL' => 'ROUNDUP',
        'KEREK.LE' => 'ROUNDDOWN', 'KEREKLE' => 'ROUNDDOWN', 'CSONK' => 'TRUNC', 'TÖBBSZ.KEREKÍT' => 'MROUND',
        'GYÖK' => 'SQRT', 'HATVÁNY' => 'POWER', 'MARADÉK' => 'MOD', 'SZORZAT' => 'PRODUCT', 'KVÓCIENS' => 'QUOTIENT',
        'VÉL' => 'RAND', 'VÉLETLEN.KÖZÖTT' => 'RANDBETWEEN',
        'FKERES' => 'VLOOKUP', 'VKERES' => 'HLOOKUP', 'KERES' => 'LOOKUP', 'XKERES' => 'XLOOKUP',
        'HOL.VAN' => 'MATCH', 'XHOL.VAN' => 'XMATCH', 'ELTOLÁS' => 'OFFSET', 'INDIREKT' => 'INDIRECT',
        'VÁLASZT' => 'CHOOSE', 'SOR' => 'ROW', 'OSZLOP' => 'COLUMN', 'SOROK' => 'ROWS', 'OSZLOPOK' => 'COLUMNS',
        'BAL' => 'LEFT', 'JOBB' => 'RIGHT', 'KÖZÉP' => 'MID', 'HOSSZ' => 'LEN',
        'ÖSSZEFŰZ' => 'CONCATENATE', 'FŰZ' => 'CONCAT', 'SZÖVEGÖSSZEFŰZÉS' => 'TEXTJOIN',
        'NAGYBETŰS' => 'UPPER', 'KISBETŰ' => 'LOWER', 'TNÉV' => 'PROPER', 'KIMETSZ' => 'TRIM',
        'SZÖVEG' => 'TEXT', 'ÉRTÉK' => 'VALUE', 'SZÖVEG.KERES' => 'SEARCH', 'SZÖVEG.TALÁL' => 'FIND',
        'CSERE' => 'REPLACE', 'HELYETTE' => 'SUBSTITUTE', 'AZONOS' => 'EXACT', 'SOKSZOR' => 'REPT',
        'MA' => 'TODAY', 'MOST' => 'NOW', 'ÉV' => 'YEAR', 'HÓNAP' => 'MONTH', 'NAP' => 'DAY',
        'ÓRA' => 'HOUR', 'PERCEK' => 'MINUTE', 'MPERC' => 'SECOND', 'DÁTUM' => 'DATE', 'IDŐ' => 'TIME',
        'HÉT.NAPJA' => 'WEEKDAY', 'HÉT.SZÁMA' => 'WEEKNUM', 'DÁTUMTÓLIG' => 'DATEDIF',
        'NAP360' => 'DAYS360', 'NAPOK' => 'DAYS', 'KALK.DÁTUM' => 'EDATE', 'HÓNAP.UTOLSÓ.NAP' => 'EOMONTH',
        'HIBÁS' => 'ISERROR', 'HIBA.E' => 'ISERR', 'ÜRES' => 'ISBLANK', 'SZÁM' => 'ISNUMBER',
        'SZÖVEG.E' => 'ISTEXT', 'NINCS' => 'ISNA', 'HIÁNYZIK' => 'NA', 'PÁROSE' => 'ISEVEN', 'PÁRATLANE' => 'ISODD',
        'IGAZ' => 'TRUE', 'HAMIS' => 'FALSE',
    ];

    /** Nevter-elotagok, amelyeket a programok az ujabb fuggvenyek ele irnak; a nev nelkuluk ertendo. */
    private const FUNCTION_PREFIXES = ['_XLFN._XLWS.', '_XLFN.', '_XLWS.', 'COM.MICROSOFT.', 'ORG.OPENOFFICE.', 'ORG.LIBREOFFICE.'];

    private const SHEET = '(?:\'(?:[^\']|\'\')+\'|[\p{L}_][\p{L}\p{N}_.]*)';

    private const CELL = '\$?[A-Za-z]{1,3}\$?[0-9]{1,7}';

    /** Ezek a szamok nem szamitanak "beirt szamnak" (nofixed): logikai jelzokent mindennaposak. */
    private const HARMLESS_NUMBERS = [0.0, 1.0];

    /** Egy token tipusa. */
    /** Ennyi byte-nal hosszabb kepletet nem ertelmezunk. */
    private const MAX_FORMULA_BYTES = 8192;

    public const STRING = 'string';

    public const REFERENCE = 'reference';

    public const FUNCTION = 'function';

    public const NAME = 'name';

    public const NUMBER = 'number';

    public const OPERATOR = 'operator';

    /** Az xlsx `<f>` elemenek szovege kanonikus alakban. */
    public static function fromSpreadsheetMl(string $formula): string
    {
        return self::canonical($formula);
    }

    /**
     * Az ods `table:formula` attributuma kanonikus alakban: a nevter-elotag
     * (`of:`, `oooc:`) lemarad, a szogletes zarojeles hivatkozasok A1 alakuak
     * lesznek, a pontosvesszo vesszo.
     */
    public static function fromOpenFormula(string $attribute): string
    {
        $formula = (string) preg_replace('/^\s*[a-z]+:(?==)/i', '', $attribute);

        // Szovegliteralon belul semmit nem alakitunk at: a paratlan indexu darabok az idezett szovegek.
        $parts = preg_split('/("(?:[^"]|"")*")/', $formula, -1, PREG_SPLIT_DELIM_CAPTURE);
        $converted = '';

        foreach ($parts === false ? [$formula] : $parts as $index => $part) {
            $converted .= $index % 2 === 1
                ? $part
                : (string) preg_replace_callback('/\[([^\[\]]+)\]/', static fn (array $match): string => self::openFormulaReference($match[1]), $part);
        }

        return self::canonical($converted);
    }

    /** Barmilyen (magyar vagy angol nevu, pontosvesszos vagy vesszos) keplet kanonikus alakja. */
    public static function canonical(string $formula): string
    {
        $formula = ltrim($formula);
        $formula = str_starts_with($formula, '=') ? substr($formula, 1) : $formula;
        $canonical = '';

        foreach (self::scan($formula) as [$type, $text]) {
            $canonical .= match ($type) {
                self::FUNCTION => self::english($text),
                self::NAME => self::english($text),
                self::REFERENCE => self::normalizeReference($text),
                self::OPERATOR => $text === ';' ? ',' : $text,
                default => $text,
            };
        }

        return $canonical;
    }

    /**
     * Egy fuggvenynev angolul, nagybetuvel, elotag nelkul: "szum" => "SUM",
     * "_xlfn.IFS" => "IFS", "SUM" => "SUM".
     */
    public static function english(string $name): string
    {
        $name = mb_strtoupper(trim($name), 'UTF-8');

        foreach (self::FUNCTION_PREFIXES as $prefix) {
            if (str_starts_with($name, $prefix)) {
                $name = substr($name, strlen($prefix));

                break;
            }
        }

        return self::FUNCTIONS[$name] ?? $name;
    }

    /**
     * A kanonikus kepletben hasznalt fuggvenyek (angol nevek), ismetlodes nelkul.
     *
     * @return list<string>
     */
    public static function functions(string $canonical): array
    {
        return self::textsOf($canonical, self::FUNCTION);
    }

    /**
     * A kanonikus keplet hivatkozasai, ahogy a kepletben allnak ("$A$1", "Munka2!B2:B9").
     *
     * @return list<string>
     */
    public static function references(string $canonical): array
    {
        return self::textsOf($canonical, self::REFERENCE);
    }

    /** Van-e a kepletben beirt szam (a 0 es az 1 kivetelevel). */
    public static function hasFixedNumbers(string $canonical): bool
    {
        foreach (self::textsOf($canonical, self::NUMBER) as $number) {
            if (! in_array((float) $number, self::HARMLESS_NUMBERS, true)) {
                return true;
            }
        }

        return false;
    }

    /**
     * A keplet a cellajahoz kepest relativ (R1C1) alakban: ket cella keplete
     * pontosan akkor "ugyanaz a masolt keplet", ha ez az alakjuk megegyezik.
     */
    public static function relativeTo(string $canonical, int $column, int $row): string
    {
        return self::mapReferences($canonical, static function (string $part) use ($column, $row): string {
            if (preg_match('/^(\$?)([A-Z]{1,3})(\$?)([0-9]{1,7})$/', $part, $match) === 1) {
                return self::relativeAxis('R', (int) $match[4], $match[3] === '$', $row)
                    .self::relativeAxis('C', CellRange::columnIndex($match[2]), $match[1] === '$', $column);
            }

            if (preg_match('/^(\$?)([A-Z]{1,3})$/', $part, $match) === 1) {
                return self::relativeAxis('C', CellRange::columnIndex($match[2]), $match[1] === '$', $column);
            }

            if (preg_match('/^(\$?)([0-9]{1,7})$/', $part, $match) === 1) {
                return self::relativeAxis('R', (int) $match[2], $match[1] === '$', $row);
            }

            return $part;
        });
    }

    /**
     * A keplet ugy, ahogy egy `$columns` oszloppal es `$rows` sorral arrebb
     * masolt cellaban allna: a relativ hivatkozasok elmozdulnak, az abszolutak
     * nem. Az xlsx megosztott kepleteinek kibontasahoz kell.
     */
    public static function shift(string $canonical, int $columns, int $rows): string
    {
        return self::mapReferences($canonical, static function (string $part) use ($columns, $rows): string {
            if (preg_match('/^(\$?)([A-Z]{1,3})?(\$?)([0-9]{1,7})?$/', $part, $match, PREG_UNMATCHED_AS_NULL) !== 1) {
                return $part;
            }

            $letters = $match[2] ?? null;
            $digits = $match[4] ?? null;
            $columnMarker = (string) $match[1];
            // Oszlop nelkuli (sor)hivatkozasnal a sor $ jelet az elso csoport fogja meg.
            $rowMarker = $letters === null ? $columnMarker : (string) $match[3];

            $column = $letters === null ? null : CellRange::columnIndex($letters) + ($columnMarker === '$' ? 0 : $columns);
            $row = $digits === null ? null : (int) $digits + ($rowMarker === '$' ? 0 : $rows);

            if (($column !== null && ($column < 1 || $column > CellRange::MAX_COLUMN)) || ($row !== null && ($row < 1 || $row > CellRange::MAX_ROW))) {
                return '#REF!';
            }

            return ($column === null ? '' : $columnMarker.CellRange::columnLetters($column))
                .($row === null ? '' : $rowMarker.$row);
        });
    }

    /**
     * A kanonikus keplet ugy, ahogy a magyar tablazatkezelo mutatja:
     * magyar fuggvenynevek, pontosvesszo, tizedesvesszo. A diaknak szolo
     * `found` szoveghez.
     */
    public static function localized(string $canonical): string
    {
        $hungarian = [];

        foreach (self::FUNCTIONS as $name => $english) {
            $hungarian[$english] ??= $name;
        }

        $localized = '';

        foreach (self::scan($canonical) as [$type, $text]) {
            $localized .= match ($type) {
                self::FUNCTION, self::NAME => $hungarian[$text] ?? $text,
                self::NUMBER => str_replace('.', ',', $text),
                self::OPERATOR => $text === ',' ? ';' : $text,
                default => $text,
            };
        }

        return $localized;
    }

    /**
     * Egy hivatkozas egyseges alakja: a munkalapnev idezojel nelkul, ha nem
     * kell, a cellaresz nagybetuvel.
     */
    public static function normalizeReference(string $reference): string
    {
        $separator = strrpos($reference, '!');
        $cells = strtoupper($separator === false ? $reference : substr($reference, $separator + 1));

        if ($separator === false) {
            return $cells;
        }

        return self::quoteSheet(CellReference::unquote(substr($reference, 0, $separator))).'!'.$cells;
    }

    /**
     * A hivatkozas munkalapneve (idezojel nelkul; null, ha nincs) es a cellaresze.
     *
     * @return array{0: string|null, 1: string}
     */
    public static function splitReference(string $reference): array
    {
        $separator = strrpos($reference, '!');

        return $separator === false
            ? [null, $reference]
            : [CellReference::unquote(substr($reference, 0, $separator)), substr($reference, $separator + 1)];
    }

    /**
     * A keplet tokenjei: [tipus, szoveg]; a szokozok kimaradnak.
     *
     * @return list<array{0: string, 1: string}>
     */
    private static function scan(string $formula): array
    {
        $pattern = '~\G(?:'
            .'(?<string>"(?:[^"]|"")*")'
            .'|(?<reference>(?:'.self::SHEET.'!)?(?:'.self::CELL.'(?::'.self::CELL.')?|\$?[A-Za-z]{1,3}:\$?[A-Za-z]{1,3}|\$?[0-9]{1,7}:\$?[0-9]{1,7})(?![\p{L}\p{N}_(!]))'
            .'|(?<function>[\p{L}_][\p{L}\p{N}_.]*)(?=\s*\()'
            .'|(?<name>[\p{L}_][\p{L}\p{N}_.]*)'
            .'|(?<number>[0-9]+(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?)'
            .'|(?<space>\s+)'
            .'|(?<operator><=|>=|<>|.)'
            .')~us';

        $length = strlen($formula);

        if ($length > self::MAX_FORMULA_BYTES) {
            throw new UnreadableFile('Egy keplet tul hosszu.');
        }

        $tokens = [];
        $offset = 0;

        while ($offset < $length && preg_match($pattern, $formula, $match, PREG_UNMATCHED_AS_NULL, $offset) === 1) {
            $offset += strlen((string) $match[0]);

            foreach ([self::STRING, self::REFERENCE, self::FUNCTION, self::NAME, self::NUMBER, self::OPERATOR] as $type) {
                if (($match[$type] ?? null) !== null) {
                    $tokens[] = [$type, $match[$type]];

                    break;
                }
            }
        }

        // Megallt a beolvasas a keplet vege elott (ervenytelen UTF-8 vagy regex-korlat): ne csonkolt kepletet vizsgaljunk.
        if ($offset < $length) {
            throw new UnreadableFile('Egy keplet nem ertelmezheto.');
        }

        return $tokens;
    }

    /**
     * @return list<string>
     */
    private static function textsOf(string $canonical, string $type): array
    {
        $texts = [];

        foreach (self::scan($canonical) as [$tokenType, $text]) {
            if ($tokenType === $type && ! in_array($text, $texts, true)) {
                $texts[] = $text;
            }
        }

        return $texts;
    }

    /**
     * A keplet, amelyben minden hivatkozas minden cellaresze (a tartomany
     * ket vege kulon) at van alakitva; a munkalapnev valtozatlan.
     *
     * @param  callable(string): string  $convert
     */
    private static function mapReferences(string $canonical, callable $convert): string
    {
        $mapped = '';

        foreach (self::scan($canonical) as [$type, $text]) {
            if ($type !== self::REFERENCE) {
                $mapped .= $text;

                continue;
            }

            [$sheet, $cells] = self::splitReference($text);

            $mapped .= ($sheet === null ? '' : self::quoteSheet($sheet).'!')
                .implode(':', array_map($convert, explode(':', $cells)));
        }

        return $mapped;
    }

    private static function relativeAxis(string $axis, int $index, bool $absolute, int $base): string
    {
        return $axis.($absolute ? (string) $index : '['.($index - $base).']');
    }

    private static function quoteSheet(string $sheet): string
    {
        return preg_match('/^[\p{L}_][\p{L}\p{N}_.]*$/u', $sheet) === 1 ? $sheet : "'".str_replace("'", "''", $sheet)."'";
    }

    /**
     * Egy OpenFormula hivatkozas belseje (a szogletes zarojelek nelkul) A1
     * alakban: ".A1:.B2" => "A1:B2", "$Munka2.$A$1" => "Munka2!$A$1",
     * "$'Eves adatok'.A1:.B2" => "'Eves adatok'!A1:B2".
     */
    private static function openFormulaReference(string $inner): string
    {
        $sheet = null;
        $cells = [];

        foreach (explode(':', $inner) as $part) {
            $separator = strrpos($part, '.');

            if ($separator === false) {
                // Nem cellahivatkozas (pl. #REF!): valtozatlanul hagyjuk, zarojel nelkul.
                return $inner;
            }

            $partSheet = CellReference::unquote(ltrim(substr($part, 0, $separator), '$'));
            $sheet ??= $partSheet === '' ? null : $partSheet;
            $cells[] = substr($part, $separator + 1);
        }

        return ($sheet === null ? '' : self::quoteSheet($sheet).'!').implode(':', $cells);
    }
}
