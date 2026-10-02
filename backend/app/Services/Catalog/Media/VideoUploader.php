<?php

declare(strict_types=1);

namespace App\Services\Catalog\Media;

use App\Exceptions\Catalog\InvalidVideoUpload;
use App\Models\Lesson;
use App\Models\LessonUpload;
use App\Models\User;

/**
 * Darabokban feltoltott leckevideo (#158). Egy feltoltes: megnyitas, darabok
 * (tetszoleges sorrendben, ismetelhetoen), lezaras. A megszakadt feltoltes onnan
 * folytathato, hogy a mar megerkezett darabok szama lekerdezheto.
 *
 * Jelenleg egy megvalositas van (LocalChunkedVideoUploader: a darabok a szerveren
 * allnak ossze). A csatlakozasi pont azert interface, hogy S3-kompatibilis
 * taroloknal a darabok kozvetlenul a tarolora (alairt part-URL-ekkel) mehessenek,
 * a PHP megkerulesevel, a hivok valtoztatasa nelkul.
 */
interface VideoUploader
{
    /** @throws InvalidVideoUpload */
    public function begin(Lesson $lesson, ?User $user, string $filename, int $size): LessonUpload;

    /**
     * Egy darab fogadasa; ugyanannak a darabnak az ujrakuldese ugyanazt eredmenyezi.
     *
     * @throws InvalidVideoUpload
     */
    public function receivePart(LessonUpload $upload, int $number, string $bytes): void;

    /**
     * A mar megerkezett darabok sorszamai, novekvo sorrendben.
     *
     * @return list<int>
     */
    public function receivedParts(LessonUpload $upload): array;

    /**
     * Osszefuzi a darabokat, ellenorzi (meret, tipus), es a videotaroloba teszi.
     * A feltoltes darabjait es sorat NEM torli: azt a hivo teszi, ha a leckehez
     * csatolas is sikerult (`discard`).
     *
     * @throws InvalidVideoUpload
     */
    public function complete(LessonUpload $upload): StoredVideo;

    /** A feltoltes darabjainak es sorának torlese (megszakitas vagy sikeres lezaras utan). */
    public function discard(LessonUpload $upload): void;

    /**
     * A felbehagyott feltoltesek takaritasa.
     *
     * @return int Hany feltoltest torolt.
     */
    public function pruneStale(): int;
}
