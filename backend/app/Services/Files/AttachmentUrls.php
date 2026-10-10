<?php

declare(strict_types=1);

namespace App\Services\Files;

use App\Models\Attachment;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\URL;

/**
 * Rovid eletu, alairt letoltesi URL-ek a csatolmanyokhoz.
 *
 * Az <img src> es az <a download> nem tud Bearer tokent kuldeni, ezert a
 * letoltest az alairas vedi: az URL hordozhato jogosultsag, amig le nem jar
 * (ugyanugy, mint a lecke-videoknal). Emiatt csak olyan eroforrasbol szabad
 * hivni, amelyet a nezo mar megnezhet (feloldott feladat, indithato vizsga,
 * admin felulet): zarolt feladat valaszaba URL soha nem kerulhet.
 *
 * Az URL abszolut, es a kero altal hasznalt hostra mutat (proxy mogott az
 * APP_URL elterhet attol, amit a bongeszo lat), de csak az utvonal es a
 * lekerdezes van alairva (`signed:relative`), mint az IssueLessonVideoUrl-nel.
 */
final class AttachmentUrls
{
    /** A letolto utvonal neve: GET /attachments/{attachment}/download, `signed:relative` middleware-rel. */
    public const ROUTE = 'api.attachments.download';

    /**
     * Az admin URL-ek alairt parametere. A letolto vezerlo csak ezzel adja ki
     * a diaknak tiltott szerepeket (`input`, `sample_solution`); mivel a
     * parameter az alairas resze, utolag nem fuzheto hozza egy diak-URL-hez.
     */
    public const ADMIN_PARAMETER = 'admin';

    /** Diaknak: feloldott feladat forrasfajlja vagy mintakepe (filetasks.url_ttl_minutes). */
    public function forStudent(Attachment $attachment): string
    {
        return $this->signed($attachment, Config::integer('filetasks.url_ttl_minutes'));
    }

    /** Admin feluletre: minden szerephez, rovidebb elettartammal (filetasks.attachments.admin_url_ttl_minutes). */
    public function forAdmin(Attachment $attachment): string
    {
        return $this->signed(
            $attachment,
            Config::integer('filetasks.attachments.admin_url_ttl_minutes'),
            [self::ADMIN_PARAMETER => 1],
        );
    }

    /**
     * Vizsga fajljaihoz: hosszabb elettartam (exams.file_url_ttl_minutes), mert
     * a vizsga orakig tart, es az oldal az elso valaszt tartja meg.
     */
    public function forExam(Attachment $attachment): string
    {
        return $this->signed($attachment, Config::integer('exams.file_url_ttl_minutes'));
    }

    /**
     * Admin URL-lel erkezett-e a keres. Csak az alairas ellenorzese
     * (`signed:relative`) utan van ertelme megkerdezni.
     */
    public function grantsAdminAccess(Request $request): bool
    {
        return $request->query(self::ADMIN_PARAMETER) === '1';
    }

    /** @param array<string, int|string> $extra */
    private function signed(Attachment $attachment, int $ttlMinutes, array $extra = []): string
    {
        return url(URL::temporarySignedRoute(
            self::ROUTE,
            CarbonImmutable::now()->addMinutes($ttlMinutes),
            ['attachment' => $attachment->id, ...$extra],
            absolute: false,
        ));
    }
}
