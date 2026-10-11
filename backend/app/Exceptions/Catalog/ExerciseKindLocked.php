<?php

declare(strict_types=1);

namespace App\Exceptions\Catalog;

use App\Exceptions\DomainException;

/**
 * A feladat fajtaja (`kind`) mar nem valtoztathato meg, mert valami a
 * jelenlegi fajtajahoz kotodik: beadasok, egy vizsgaresz, vagy csatolt fajlok.
 * A hiba a `kind` mezohoz tartozik, es megmondja, mit kell elobb megszuntetni.
 */
final class ExerciseKindLocked extends DomainException
{
    /** Diakok mar adtak be megoldast (kodot vagy fajlt): a korabbi eredmenyek ertelmuket vesztenek. */
    public static function hasStudentWork(): self
    {
        return new self(__('catalog.kind_locked'));
    }

    /** Egy vizsgaresz erre a feladatra mutat, es a resz a feladat fajtajara epul. */
    public static function usedByExam(): self
    {
        return new self(__('catalog.kind_used_by_exam'));
    }

    /** A csatolt fajlok szabalyai (szerep, meret, tipus) a fajtatol fuggnek. */
    public static function hasAttachments(): self
    {
        return new self(__('catalog.kind_has_attachments'));
    }

    public function status(): int
    {
        return 422;
    }

    public function errors(): array
    {
        return ['kind' => [$this->getMessage()]];
    }
}
