<?php

declare(strict_types=1);

namespace App\Services\Catalog\Media;

use App\Exceptions\Catalog\LessonVideoMissing;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Storage;
use League\Flysystem\Local\LocalFilesystemAdapter;
use Symfony\Component\HttpFoundation\Response;

/**
 * A privat videotarolo egy fajljanak kiszolgalasa (video vagy felirat): a diak oldali
 * es az admin elonezeti vegpont is ezt hasznalja. A hivo felelos azert, hogy a
 * kerest alairt URL vedje.
 */
final class MediaResponse
{
    /** @throws LessonVideoMissing */
    public function video(?string $path): Response
    {
        return $this->serve($path, []);
    }

    /** @throws LessonVideoMissing */
    public function captions(?string $path): Response
    {
        return $this->serve($path, ['Content-Type' => 'text/vtt; charset=utf-8']);
    }

    /**
     * Helyi tarolonal BinaryFileResponse: tamogatja a Range kereseket, igy a lejatszoban
     * lehet tekerni.
     *
     * @param  array<string, string>  $headers
     *
     * @throws LessonVideoMissing
     */
    private function serve(?string $path, array $headers): Response
    {
        $disk = Storage::disk(Config::string('catalog.video.disk'));

        if ($path === null || ! $disk->exists($path)) {
            throw new LessonVideoMissing;
        }

        $response = $this->isLocal($disk)
            ? response()->file($disk->path($path), $headers)
            : $disk->response($path, null, $headers);

        // A BinaryFileResponse alapbol "public": egy kozos cache (proxy, CDN) tovabbadhatna a
        // premium videot. Csak a kero bongeszoje tarolhatja.
        $response->setPrivate();
        $response->setMaxAge(600);
        $response->headers->set('X-Content-Type-Options', 'nosniff');

        return $response;
    }

    private function isLocal(FilesystemAdapter $disk): bool
    {
        return $disk->getAdapter() instanceof LocalFilesystemAdapter;
    }
}
