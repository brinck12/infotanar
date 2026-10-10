<?php

declare(strict_types=1);

namespace App\Services\FileTasks;

use App\Enums\RubricCheckType;

/**
 * Az ertekelolap-szerkeszto egyetlen kerdezopontja: elmentheto-e egy
 * automatikus pont. A valaszt a tipus kezeloi adjak (CheckHandler::validate),
 * igy a szerkeszteskor elfogadott es az ertekeleskor vegrehajthato nyelvtan
 * nem tud elterni.
 */
final readonly class RubricCheckCatalog
{
    public function __construct(private CheckRegistry $registry) {}

    /**
     * Ervenyes-e a `property` es az `expected` az adott tipusra.
     *
     * - `manual`: mindig ervenyes (nincs mit vegrehajtani).
     * - Nincs kezelo a tipushoz (a csaladja meg nem keszult el): hiba, a pont
     *   csak kezi modban mentheto.
     * - Tobb kezelo: eleg, ha egy elfogadja; ha egyik sem, az elso hibaja megy vissza.
     *
     * @return string|null magyar hibauzenet az admin urlap `property` mezojehez, vagy null, ha a pont mentheto
     */
    public function validate(RubricCheckType $checkType, string $property, string $expected): ?string
    {
        if ($checkType->isManual()) {
            return null;
        }

        $firstError = null;

        foreach ($this->registry->handlersFor($checkType) as $handler) {
            $error = $handler->validate($property, $expected);

            if ($error === null) {
                return null;
            }

            $firstError ??= $error;
        }

        return $firstError ?? __('filetasks.check_unavailable');
    }

    /** Ertekelheto-e a tipus automatikusan (van-e hozza legalabb egy kezelo). */
    public function isAutomated(RubricCheckType $checkType): bool
    {
        return $this->registry->handlersFor($checkType) !== [];
    }

    /**
     * Az automatikusan ertekelheto tipusok.
     *
     * @return list<RubricCheckType>
     */
    public function automatedTypes(): array
    {
        return $this->registry->automatedTypes();
    }
}
