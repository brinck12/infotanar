<?php

declare(strict_types=1);

namespace App\Services\Files;

use App\Services\FileTasks\UnreadableFile;
use DOMDocument;
use Illuminate\Support\Facades\Config;
use XMLReader;

/**
 * Nem megbizhato (diak altal feltoltott) XML es HTML biztonsagos betoltese.
 *
 * Minden olvaso ezen at tolt be, soha nem kozvetlenul a DOMDocument-tel:
 *  - DOCTYPE-ot vagy ENTITY-t tartalmazo XML-t nem fogadunk el (nincs DTD,
 *    nincs entitas, igy nincs XXE es nincs "billion laughs");
 *  - a halozat tiltott (LIBXML_NONET), entitas-behelyettesites es DTD-betoltes
 *    soha nincs bekapcsolva (LIBXML_NOENT, LIBXML_DTDLOAD, LIBXML_DTDATTR);
 *  - a libxml alap melysegi es meretkorlatai ervenyben maradnak (nincs
 *    LIBXML_PARSEHUGE).
 *
 * A metodusok allapot nelkuliek, ezert statikusak.
 */
final class XmlSafety
{
    private const FLAGS = LIBXML_NONET | LIBXML_NOBLANKS;

    /**
     * XML-resz betoltese DOM-ba. Csak kis reszekhez (stilusok, munkafuzet,
     * dokumentumtorzs meretkorlattal); nagy munkalapokhoz a reader() valo.
     *
     * @throws UnreadableFile ha az XML DOCTYPE-ot vagy ENTITY-t tartalmaz, nem ertelmezheto, vagy tul sok csomopontbol all
     */
    public static function load(string $xml): DOMDocument
    {
        self::assertNoDoctype($xml);

        $document = new DOMDocument;
        $loaded = self::quietly(static fn (): bool => $xml !== '' && $document->loadXML($xml, self::FLAGS));

        if (! $loaded) {
            throw new UnreadableFile('Az XML nem ertelmezheto.');
        }

        // A bajtsorozat-kereses UTF-16 kodolasnal nem talalna meg a DOCTYPE-ot: a fa a biztos.
        if ($document->doctype !== null) {
            throw new UnreadableFile('Az XML DOCTYPE-ot tartalmaz.');
        }

        if ($document->getElementsByTagName('*')->length > Config::integer('filetasks.max_dom_nodes')) {
            throw new UnreadableFile('Az XML tul sok csomopontbol all.');
        }

        return $document;
    }

    /**
     * Folyamolvaso nagy XML-reszekhez (munkalap, megosztott szovegek): a
     * memoriahasznalat nem no a resz meretevel. A hivo zarja le (close()).
     *
     * @throws UnreadableFile ha az XML DOCTYPE-ot vagy ENTITY-t tartalmaz, vagy nem nyithato meg
     */
    public static function reader(string $xml): XMLReader
    {
        self::assertNoDoctype($xml);

        $reader = self::quietly(static fn (): XMLReader|bool => $xml === '' ? false : XMLReader::XML($xml, null, self::FLAGS));

        if (! $reader instanceof XMLReader) {
            throw new UnreadableFile('Az XML nem nyithato meg.');
        }

        return $reader;
    }

    /**
     * HTML betoltese DOM-ba (weboldal-feladat). A HTML-ben a DOCTYPE
     * megengedett; a tartalmat csak elemezzuk, soha nem jelenitjuk meg es nem
     * futtatjuk, halozati hivas es beemeles nincs.
     *
     * @throws UnreadableFile ha a HTML ures vagy nem ertelmezheto
     */
    public static function loadHtml(string $html): DOMDocument
    {
        $document = new DOMDocument;

        // Kodolas-deklaracio nelkul a libxml Latin-1-nek venne az ekezetes szoveget.
        $loaded = self::quietly(static fn (): bool => trim($html) !== ''
            && $document->loadHTML('<?xml encoding="UTF-8">'.$html, LIBXML_NONET | LIBXML_NOERROR | LIBXML_NOWARNING));

        if (! $loaded) {
            throw new UnreadableFile('A HTML nem ertelmezheto.');
        }

        if ($document->getElementsByTagName('*')->length > Config::integer('filetasks.max_dom_nodes')) {
            throw new UnreadableFile('A HTML tul sok elembol all.');
        }

        return $document;
    }

    /**
     * @throws UnreadableFile ha az XML DOCTYPE vagy ENTITY deklaraciot tartalmaz
     */
    public static function assertNoDoctype(string $xml): void
    {
        if (stripos($xml, '<!DOCTYPE') !== false || stripos($xml, '<!ENTITY') !== false) {
            throw new UnreadableFile('Az XML DOCTYPE vagy ENTITY deklaraciot tartalmaz.');
        }
    }

    /**
     * A libxml hibai ne keruljenek a kimenetre vagy a naploba (diak altal
     * feltoltott tartalom reszletei lennenek); a korabbi beallitast visszaallitjuk.
     *
     * @template T
     *
     * @param  callable(): T  $callback
     * @return T
     */
    private static function quietly(callable $callback): mixed
    {
        $previous = libxml_use_internal_errors(true);

        try {
            return $callback();
        } finally {
            libxml_clear_errors();
            libxml_use_internal_errors($previous);
        }
    }
}
