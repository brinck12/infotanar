<?php

declare(strict_types=1);

namespace App\Services\Files;

use Closure;
use Illuminate\Contracts\Filesystem\FileNotFoundException;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Filesystem\LocalFilesystemAdapter;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use LengthException;
use RuntimeException;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * A ket privat tarolo (FileDisk) egyetlen kezeloje: feladatok csatolmanyai es
 * a diakok beadasai.
 *
 * Szabalyok, amelyeket ez az osztaly garantal:
 *  - a tarolasi nev mindig veletlen (ULID + az ellenorzott kiterjesztes), a
 *    felhasznalo altal adott nevbol soha nem keszul utvonal;
 *  - a fajlt folyamkent masoljuk es szolgaljuk ki, nem olvassuk a memoriaba
 *    (kiveve a bytes(), amelynek kemeny korlatja lehet);
 *  - a kiszolgalt fajl soha nem futhat a bongeszoben (nosniff, sandbox CSP,
 *    alapbol letoltes).
 */
final class PrivateFileStore
{
    /** Ezek a keptipusok jelenithetok meg beagyazva (<img>); minden mas letoltes. */
    private const INLINE_MIME = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];

    /**
     * Eltarol egy ellenorzott feltoltest a `{directory}/{prefix}{ulid}{kiterjesztes}` utvonalra.
     *
     * @param  string  $directory  relativ mappa a tarolon, pl. "exercise/12" vagy "u5/e12"
     * @param  string  $prefix  a fajlnev eleje a veletlen resz elott, pl. "p3-"
     *
     * @throws RuntimeException ha a tarolo nem tudta kiirni a fajlt
     */
    public function put(FileDisk $disk, string $directory, InspectedUpload $upload, string $prefix = ''): StoredFile
    {
        $path = $this->newPath($directory, $upload->extension, $prefix);
        $stream = fopen($upload->localPath, 'rb');

        if ($stream === false) {
            throw new RuntimeException('A feltoltott fajl nem olvashato.');
        }

        try {
            $written = $this->disk($disk)->writeStream($path, $stream);
        } finally {
            if (is_resource($stream)) {
                fclose($stream);
            }
        }

        if (! $written) {
            throw new RuntimeException("A fajl nem irhato ki a(z) {$disk->value} tarolora.");
        }

        return new StoredFile($disk, $path, $upload->name, $upload->extension, $upload->size, $upload->sha256, $upload->mime);
    }

    /**
     * Eltarol egy memoriaban levo tartalmat (seeder, generalt fajl). Feltoltott
     * fajlhoz a put() valo, mert az nem olvas a memoriaba.
     *
     * @param  string  $name  megjelenitesi nev; a kiterjesztese kerul a tarolasi nevbe
     *
     * @throws RuntimeException ha a tarolo nem tudta kiirni a fajlt
     */
    public function putContents(FileDisk $disk, string $directory, string $name, string $contents, string $mime = 'application/octet-stream', string $prefix = ''): StoredFile
    {
        $name = UploadedFileInspector::safeName($name);
        $extension = UploadedFileInspector::extensionOf($name);
        $path = $this->newPath($directory, $extension, $prefix);

        if (! $this->disk($disk)->put($path, $contents)) {
            throw new RuntimeException("A fajl nem irhato ki a(z) {$disk->value} tarolora.");
        }

        return new StoredFile($disk, $path, $name, $extension, strlen($contents), hash('sha256', $contents), $mime);
    }

    public function exists(StoredFile $file): bool
    {
        return $this->disk($file->disk)->exists($file->path);
    }

    /**
     * A fajl teljes tartalma a memoriaba. Csak kis fajlokra (pl. a Judge0-nak
     * kuldott forrasfajl): nagy fajlhoz a stream() vagy a withLocalPath() valo.
     *
     * @param  int|null  $maxBytes  ennel nagyobb fajlt nem olvas be
     *
     * @throws FileNotFoundException ha a fajl nincs a tarolon
     * @throws LengthException ha a fajl nagyobb a korlatnal
     */
    public function bytes(StoredFile $file, ?int $maxBytes = null): string
    {
        $disk = $this->disk($file->disk);

        if (! $disk->exists($file->path)) {
            throw new FileNotFoundException("Nincs ilyen fajl a(z) {$file->disk->value} tarolon: {$file->path}");
        }

        if ($maxBytes !== null && $disk->size($file->path) > $maxBytes) {
            throw new LengthException("A fajl nagyobb a megengedettnel: {$file->path}");
        }

        return (string) $disk->get($file->path);
    }

    /**
     * Olvashato folyam a fajlra; a hivo zarja le (fclose).
     *
     * @return resource
     *
     * @throws FileNotFoundException ha a fajl nincs a tarolon
     */
    public function stream(StoredFile $file)
    {
        $stream = $this->disk($file->disk)->readStream($file->path);

        if (! is_resource($stream)) {
            throw new FileNotFoundException("Nincs ilyen fajl a(z) {$file->disk->value} tarolon: {$file->path}");
        }

        return $stream;
    }

    /**
     * A fajlt helyi utvonalon adja at a visszahivasnak: a ZipArchive csak
     * helyi fajlt tud megnyitni. Helyi tarolonal ez maga a fajl (masolas
     * nelkul); tavoli tarolonal ideiglenes masolat, amely a visszahivas utan torlodik.
     *
     * @template T
     *
     * @param  Closure(string): T  $callback
     * @return T
     *
     * @throws FileNotFoundException ha a fajl nincs a tarolon
     */
    public function withLocalPath(StoredFile $file, Closure $callback): mixed
    {
        $disk = $this->disk($file->disk);

        if ($disk instanceof LocalFilesystemAdapter) {
            if (! $disk->exists($file->path)) {
                throw new FileNotFoundException("Nincs ilyen fajl a(z) {$file->disk->value} tarolon: {$file->path}");
            }

            return $callback($disk->path($file->path));
        }

        $temporary = tempnam(sys_get_temp_dir(), 'infotanar-file-');

        if ($temporary === false) {
            throw new RuntimeException('Nem hozhato letre ideiglenes fajl.');
        }

        try {
            $source = $this->stream($file);

            try {
                file_put_contents($temporary, $source);
            } finally {
                fclose($source);
            }

            return $callback($temporary);
        } finally {
            @unlink($temporary);
        }
    }

    /** Torli a fajlt; a mar hianyzo fajl nem hiba (a torles ujrafuttathato). */
    public function delete(StoredFile $file): void
    {
        $this->deletePath($file->disk, $file->path);
    }

    /** Ugyanez utvonal alapjan, ha a sorbol mar csak az utvonal ismert. */
    public function deletePath(FileDisk $disk, string $path): void
    {
        $this->disk($disk)->delete($path);
    }

    /** Egy mappa a teljes tartalmaval (pl. egy felhasznalo osszes beadasa: "u5"). */
    public function deleteDirectory(FileDisk $disk, string $directory): void
    {
        $this->disk($disk)->deleteDirectory($directory);
    }

    /**
     * A fajl kiszolgalasa folyamkent, a privat fajlok kozos fejleceivel.
     *
     * Alapbol letoltes (`attachment`). Beagyazva (`inline`) csak akkor megy,
     * ha a hivo keri ES a tipus megjelenitheto kep; minden mas letoltes marad,
     * igy feltoltott HTML vagy SVG soha nem fut a mi originunkon.
     *
     * @param  int  $maxAge  ennyi masodpercig tarolhatja a bongeszo (privat cache)
     *
     * @throws FileNotFoundException ha a fajl nincs a tarolon
     */
    public function response(StoredFile $file, bool $inline = false, int $maxAge = 600): StreamedResponse
    {
        $stream = $this->stream($file);
        $disposition = $inline && in_array($file->mime, self::INLINE_MIME, true) ? 'inline' : 'attachment';

        return response()->stream(static function () use ($stream): void {
            fpassthru($stream);
            fclose($stream);
        }, 200, [
            'Content-Type' => $file->mime,
            'Content-Length' => (string) $file->size,
            'Content-Disposition' => $disposition."; filename*=UTF-8''".rawurlencode($file->name),
            'X-Content-Type-Options' => 'nosniff',
            'Content-Security-Policy' => "default-src 'none'; sandbox",
            'Cache-Control' => "private, max-age={$maxAge}",
        ]);
    }

    private function disk(FileDisk $disk): FilesystemAdapter
    {
        return Storage::disk($disk->diskName());
    }

    private function newPath(string $directory, string $extension, string $prefix): string
    {
        // Csak egyszeru kiterjesztes kerulhet az utvonalba; barmi mas kiterjesztes nelkul tarolodik.
        $suffix = preg_match('/^\.[a-z0-9]{1,8}$/', $extension) === 1 ? $extension : '';

        return trim($directory, '/').'/'.$prefix.Str::lower((string) Str::ulid()).$suffix;
    }
}
