<?php

declare(strict_types=1);

namespace App\Services\FileTasks;

/**
 * Egy megnyitott, ertelmezett feltoltes. Jelolo interfesz: a tenyleges modell
 * (SpreadsheetModel, DocumentModel...) a csaladja olvasojae, a vizsgalatok a
 * CheckHandler::supports() metodusban dontik el, tudnak-e vele dolgozni
 * (`$file instanceof SpreadsheetModel`).
 *
 * A megvalositas csak olvashato legyen: ugyanazt a peldanyt az ertekelolap
 * minden pontja megkapja.
 */
interface OpenedFile
{
    /**
     * "Amit a fajlban talaltunk": rovid osszefoglalo adatok a diaknak
     * (lapmeret, margok, munkalapok, diak szama...). A beadas eredmenyenek
     * `facts` listaja lesz belole.
     *
     * Csak ilyen osszefoglalo mehet ki; a fajl tartalmat ne idezze vissza.
     *
     * @return list<Fact>
     */
    public function facts(): array;
}
