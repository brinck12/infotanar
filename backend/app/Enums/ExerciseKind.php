<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * A feladat fajtaja (`exercises.kind`). Az ertekek pontosan a frontend
 * `ExerciseKind` uniojanak felelnek meg (frontend/src/types/index.ts).
 *
 * Harom csalad van, es minden fajta pontosan egybe tartozik:
 *  - szerkesztos (code, sql): Monaco + Futtatas/Beadas, a Judge0 ertekeli;
 *  - feltoltos (sheet_upload, doc_upload, visual_upload): a diak fajlt ad be,
 *    az ertekelolap (rubric_items) alapjan a szerver pontozza;
 *  - bongeszos (sheet_browser, doc_browser, web): az ellenorzes a bongeszoben
 *    fut, a szerver nem ertekel, ezert a haladasba sem szamit bele.
 */
enum ExerciseKind: string
{
    case Code = 'code';
    case Sql = 'sql';
    case SheetUpload = 'sheet_upload';
    case SheetBrowser = 'sheet_browser';
    case DocUpload = 'doc_upload';
    case DocBrowser = 'doc_browser';
    case Web = 'web';
    case VisualUpload = 'visual_upload';

    /** A beepitett szerkesztoben megoldott, a /run es /submissions vegponton ertekelt feladat. */
    public function isEditorBased(): bool
    {
        return in_array($this, [self::Code, self::Sql], true);
    }

    /** Fajlfeltoltessel megoldott, ertekelolappal pontozott feladat. */
    public function isUpload(): bool
    {
        return in_array($this, [self::SheetUpload, self::DocUpload, self::VisualUpload], true);
    }

    /** Csak a bongeszoben ellenorzott gyakorlo: a szerveren nincs beadas es nincs allapot. */
    public function isBrowserOnly(): bool
    {
        return in_array($this, [self::SheetBrowser, self::DocBrowser, self::Web], true);
    }

    /** Fogad-e fajlbeadast (POST /exercises/{exercise}/file-submissions). */
    public function acceptsFileSubmission(): bool
    {
        return $this->isUpload();
    }

    /**
     * Szamit-e a lecke teljesitesebe es kap-e `my_status`-t: csak az, amit a
     * szerver ertekel (a bongeszos fajtakrol a szerver semmit nem tud).
     */
    public function isGradable(): bool
    {
        return ! $this->isBrowserOnly();
    }

    /**
     * A fajtahoz illo beadhato kiterjesztesek (ponttal, kisbetuvel); nem
     * feltoltos fajtanal ures. A feladat `spec.accepted_extensions` listaja
     * ennek reszhalmaza kell legyen.
     *
     * @return list<string>
     */
    public function uploadExtensions(): array
    {
        return match ($this) {
            self::SheetUpload => ['.xlsx', '.ods'],
            self::DocUpload => ['.docx', '.odt'],
            self::VisualUpload => ['.pptx', '.odp', '.svg', '.png'],
            default => [],
        };
    }

    /**
     * A szerver altal ertekelt fajtak ertekei (pl. `whereIn('kind', ...)` szureshez).
     *
     * @return list<string>
     */
    public static function gradableValues(): array
    {
        return array_values(array_map(
            static fn (self $kind): string => $kind->value,
            array_filter(self::cases(), static fn (self $kind): bool => $kind->isGradable()),
        ));
    }
}
