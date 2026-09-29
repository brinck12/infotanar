<?php

declare(strict_types=1);

namespace App\Actions\Catalog;

use App\Exceptions\Access\PremiumContentLocked;
use App\Exceptions\Catalog\LessonVideoMissing;
use App\Models\Lesson;
use App\Models\User;
use App\Services\Access\ContentAccess;
use App\Services\Catalog\LessonVideoUrl;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;

/**
 * Rovid eletu URL-t ad a lecke videojahoz, a premium szabaly (#23)
 * ellenorzese utan. Tartos, publikus URL soha nem keletkezik: S3-szeru
 * taroloknal a tarolo sajat alairt URL-je, helyi tarolonal a sajat,
 * alairt stream-vegpontunk.
 */
final readonly class IssueLessonVideoUrl
{
    public function __construct(private ContentAccess $access) {}

    /**
     * @throws PremiumContentLocked
     * @throws LessonVideoMissing
     */
    public function handle(Lesson $lesson, ?User $user): LessonVideoUrl
    {
        $denial = $this->access->denialFor($user, $lesson);
        if ($denial !== null) {
            throw new PremiumContentLocked($denial);
        }

        $disk = Storage::disk(Config::string('catalog.video.disk'));

        if ($lesson->video_path === null || ! $disk->exists($lesson->video_path)) {
            throw new LessonVideoMissing;
        }

        $expiresAt = CarbonImmutable::now()->addMinutes(Config::integer('catalog.video.url_ttl_minutes'));

        // Helyi tarolonal relativ alairas + a kero altal hasznalt host: proxy mogott
        // az APP_URL eltérhet attol a cimtol, amit a bongeszo lat.
        $url = $disk->providesTemporaryUrls()
            ? $disk->temporaryUrl($lesson->video_path, $expiresAt)
            : url(URL::temporarySignedRoute('api.lessons.video.stream', $expiresAt, ['lesson' => $lesson->id], absolute: false));

        return new LessonVideoUrl($url, $expiresAt);
    }
}
