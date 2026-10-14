<?php

declare(strict_types=1);

namespace App\Services\FileTasks;

use App\Services\Files\StoredFile;

/**
 * Egy fajlcsalad olvasoja (tablazat, dokumentum, bemutato, vektor, weboldal,
 * kep). A feltoltott fajlt EGYSZER ertelmezi, es egy OpenedFile-t ad, amelyen
 * az ertekelolap osszes pontja lefut.
 *
 * Megvalositasi szabalyok (BACKEND.md 5.1):
 *  - a tartalmat a PrivateFileStore-on at eri el (withLocalPath, stream),
 *    lemezre soha nem csomagol ki;
 *  - zip-bejegyzest csak a ZipSafety::read korlatjaval, XML-t es HTML-t csak
 *    az XmlSafety-n at tolt be;
 *  - a fajlban talalt kodot nem futtatja, URL-t nem ker le, shellt nem hiv;
 *  - barmi, ami miatt a fajl nem ertelmezheto (serult, csonka, hianyzo
 *    kotelezo resz, tul nagy), UnreadableFile kivetel.
 *
 * Az osztalyokat a config/filetasks.php `readers` listaja nevezi meg; a
 * CheckRegistry a kontenerbol peldanyositja oket (konstruktor-injektalas).
 */
interface FileReader
{
    /**
     * Az olvaso altal kezelt kiterjesztesek, kisbetuvel es ponttal (pl. [".xlsx", ".ods"]).
     * Egy kiterjesztest pontosan egy olvaso kezelhet.
     *
     * @return list<string>
     */
    public function extensions(): array;

    /**
     * Megnyitja es ertelmezi a tarolt fajlt.
     *
     * @throws UnreadableFile ha a fajl serult, vagy nem a kiterjesztesenek megfelelo formatumu
     */
    public function open(StoredFile $file): OpenedFile;
}
