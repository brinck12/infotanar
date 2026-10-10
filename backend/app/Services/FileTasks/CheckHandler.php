<?php

declare(strict_types=1);

namespace App\Services\FileTasks;

use App\Enums\RubricCheckType;
use App\Models\RubricItem;

/**
 * Egy vizsgalattipus (RubricCheckType) kezeloje egy fajlcsaladra.
 *
 * Egy tipushoz tobb kezelo is tartozhat (pl. `image` dokumentumban es
 * bemutatoban): ertekeleskor az elso fut le, amelyik a megnyitott fajlt
 * tamogatja; ha egyik sem, a pont "bad". A `manual` tipusnak nincs kezeloje.
 *
 * Minden vizsgalat mindent vagy semmit er (az ertekelolap pontjai
 * oszthatatlanok, mint a hivatalos javitasi utmutatoban).
 *
 * Az osztalyokat a config/filetasks.php `checks` listaja nevezi meg; a
 * CheckRegistry a kontenerbol peldanyositja oket. A kezelo allapotmentes
 * legyen: ugyanaz a peldany tobb pontot es tobb fajlt is kiertekel.
 */
interface CheckHandler
{
    /** A kezelt vizsgalattipus. */
    public function type(): RubricCheckType;

    /**
     * Tud-e a kezelo ezzel a megnyitott fajllal dolgozni (jellemzoen egy
     * `instanceof` a csalad modelljere). Rossz csaladnal false: a pont "bad".
     */
    public function supports(OpenedFile $file): bool;

    /**
     * A `property` es az `expected` ellenorzese szerkeszteskor, fajl nelkul.
     * Pontosan azt fogadja el, amit az evaluate() ki is tud ertekelni, igy
     * minden elmentett automatikus pont vegrehajthato.
     *
     * @return string|null magyar hibauzenet (az admin urlap `property` mezoje ala kerul), vagy null, ha ervenyes
     */
    public function validate(string $property, string $expected): ?string;

    /**
     * A pont kiertekelese a megnyitott fajlon. Csak akkor hivjuk, ha a
     * supports() igazat adott. Ha nincs mit vizsgalni (a tulajdonsag nincs a
     * fajlban), az eredmeny sikertelen, `found` nelkul.
     *
     * Kivetelt dobhat: az ertekelo elkapja, a pontot "bad"-nek veszi
     * (`found = null`), naplozza, es folytatja a kovetkezo ponttal.
     */
    public function evaluate(OpenedFile $file, RubricItem $item): CheckOutcome;
}
