<?php

declare(strict_types=1);

namespace App\Services\Execution\Comparison;

/**
 * Egy feladat kimenet-osszevetesi beallitasai. Tarolasi alak
 * (`exercises.comparison`, NULL = alapertelmezes):
 *
 *     { "mode": "numeric", "abs_tol": 0.01, "rel_tol": 0, "case_insensitive": false,
 *       "ignore_accents": false, "ignore_blank_lines": false }
 *
 * A turesek csak `numeric` modban szamitanak, az `ignore_blank_lines` csak
 * `exact` modban (a masik ketto a sortoreseket eleve nem nezi). Az ismeretlen
 * kulcsokat figyelmen kivul hagyjuk, a hianyzokat az alapertek potolja: az
 * ervenyesseget az admin FormRequest ellenorzi, itt nincs mit elrontani.
 */
final readonly class ComparisonSettings
{
    public function __construct(
        public ComparisonMode $mode = ComparisonMode::Exact,
        /** Abszolut tures: |a - b| legfeljebb ennyi. */
        public float $absTol = 0.0,
        /** Relativ tures: |a - b| legfeljebb ennyi szorosa a nagyobb abszolut erteknek. */
        public float $relTol = 0.0,
        public bool $caseInsensitive = false,
        /** Az ekezet nelkul irt kimenet is jo ("kerek" = "kérek"). */
        public bool $ignoreAccents = false,
        public bool $ignoreBlankLines = false,
    ) {}

    /**
     * A feladatra ervenyes beallitas.
     *
     * Beallitas nelkul a reszfeladatonkent pontozott feladat szamerzekeny,
     * elemenkenti osszevetest kap (az erettsegin a szamok es a lenyegi tartalom
     * szamit, nem a tordeles), minden mas feladat a regi, soronkenti egyezest.
     *
     * @param  array<string, mixed>|null  $stored  az `exercises.comparison` oszlop
     */
    public static function resolve(?array $stored, bool $scoredBySubtask): self
    {
        if ($stored !== null) {
            return self::fromArray($stored);
        }

        return new self($scoredBySubtask ? ComparisonMode::Numeric : ComparisonMode::Exact);
    }

    /** @param array<string, mixed> $data */
    public static function fromArray(array $data): self
    {
        $mode = is_string($data['mode'] ?? null) ? ComparisonMode::tryFrom($data['mode']) : null;

        return new self(
            $mode ?? ComparisonMode::Exact,
            self::tolerance($data['abs_tol'] ?? null),
            self::tolerance($data['rel_tol'] ?? null),
            ($data['case_insensitive'] ?? false) === true,
            ($data['ignore_accents'] ?? false) === true,
            ($data['ignore_blank_lines'] ?? false) === true,
        );
    }

    private static function tolerance(mixed $value): float
    {
        if (! is_numeric($value)) {
            return 0.0;
        }

        $tolerance = (float) $value;

        return is_finite($tolerance) ? max(0.0, $tolerance) : 0.0;
    }
}
