<?php

declare(strict_types=1);

namespace App\Services\Files;

use App\Exceptions\FileTasks\MacroEnabledFile;
use App\Exceptions\FileTasks\UnsupportedUpload;
use App\Exceptions\FileTasks\UploadTooLarge;
use finfo;
use Illuminate\Http\UploadedFile;
use Illuminate\Process\Exceptions\ProcessTimedOutException;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Process;
use Normalizer;

/**
 * Minden feltoltes egyetlen ellenorzo csovezeteke: diak fajlbeadasa,
 * vizsgaresz fajlja, admin csatolmany. Vezerloben vagy Actionben soha ne
 * legyen sajat, alkalmi fajlellenorzes.
 *
 * Az ellenorzes semmit nem tarol: a sikeres eredmenyt (InspectedUpload) a
 * PrivateFileStore::put teszi el. A kliens allitasaiban (MIME-tipus, nev)
 * nem bizunk: a tipust a tartalombol allapitjuk meg, a nevbol csak
 * megjelenitesi szoveg lesz.
 */
final readonly class UploadedFileInspector
{
    private const ZIP_SIGNATURE = "PK\x03\x04";

    private const PNG_SIGNATURE = "\x89PNG\x0D\x0A\x1A\x0A";

    /** A zip-kontener csaladja: OOXML, ODF es a sima zip. */
    private const ZIP_EXTENSIONS = ['.docx', '.xlsx', '.pptx', '.odt', '.ods', '.odp', '.zip'];

    /** Kiterjesztes => a finfo altal elvart MIME-tipus a raszteres kepeknel. */
    private const RASTER_MIME = [
        '.png' => 'image/png',
        '.jpg' => 'image/jpeg',
        '.jpeg' => 'image/jpeg',
        '.webp' => 'image/webp',
    ];

    /** Szoveges tartalomnal a finfo ezeket is adhatja a `text/*` mellett. */
    private const TEXT_LIKE_MIME = ['application/xml', 'image/svg+xml', 'application/json', 'application/javascript', 'application/csv'];

    /** A megjelenitesi nev legnagyobb hossza byte-ban (file_submissions.original_name). */
    private const MAX_NAME_BYTES = 255;

    private const SCAN_TIMEOUT_SECONDS = 20;

    public function __construct(private ZipSafety $zipSafety) {}

    /**
     * Vegigviszi a feltoltest az osszes ellenorzesen.
     *
     * @param  list<string>  $allowedExtensions  az adott helyen elfogadott kiterjesztesek ponttal (pl. a feladat
     *                                           `spec.accepted_extensions` listaja); csak az szamit belole, ami a
     *                                           `filetasks.extensions` terkepben is szerepel
     * @param  string|null  $category  melyik kategoria meretkorlatja ervenyes (document, image, text, archive);
     *                                 null = a kiterjesztes sajat kategoriaja
     * @param  int|null  $maxBytes  tovabbi, szigorubb meretkorlat byte-ban (pl. csatolmany-szerepenkent); a
     *                              kategoria korlatjat nem lazitja
     *
     * @throws MacroEnabledFile makros kiterjesztes vagy makrot tartalmazo csomag
     * @throws UnsupportedUpload nem elfogadott kiterjesztes, a kiterjesztesnek nem megfelelo tartalom, nem
     *                           biztonsagos archivum, ures vagy felbeszakadt feltoltes
     * @throws UploadTooLarge a fajl nagyobb a korlatnal
     */
    public function inspect(UploadedFile $file, array $allowedExtensions, ?string $category = null, ?int $maxBytes = null): InspectedUpload
    {
        $name = self::safeName($file->getClientOriginalName());
        $extension = self::extensionOf($name);
        $accepted = $this->accepted($allowedExtensions);

        // A tiltott csaladok mindig elobb: akkor is elutasitjuk, ha valaki felsorolta oket.
        if (in_array($extension, Config::array('filetasks.macro_extensions'), true)) {
            throw new MacroEnabledFile;
        }

        if (in_array($extension, Config::array('filetasks.blocked_extensions'), true) || ! in_array($extension, $accepted, true)) {
            throw UnsupportedUpload::extension($extension, $accepted);
        }

        $category ??= self::categoryOf($extension);
        $limit = min(self::maxBytesFor((string) $category), $maxBytes ?? PHP_INT_MAX);

        // A PHP sajat korlatjan (upload_max_filesize) fennakadt feltoltes is "tul nagy".
        if (in_array($file->getError(), [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true)) {
            throw new UploadTooLarge(max($limit + 1, (int) UploadedFile::getMaxFilesize()), $limit);
        }

        $path = $file->getRealPath();

        if (! $file->isValid() || $path === false) {
            throw UnsupportedUpload::uploadFailed();
        }

        $size = (int) $file->getSize();

        if ($size === 0) {
            throw UnsupportedUpload::emptyFile();
        }

        if ($size > $limit) {
            throw new UploadTooLarge($size, $limit);
        }

        $mime = $this->sniff($path);
        $this->assertContentMatches($path, $extension, $mime);
        $this->scan($path);

        $hash = hash_file('sha256', $path);

        if ($hash === false) {
            throw UnsupportedUpload::uploadFailed();
        }

        return new InspectedUpload($path, $name, $extension, (string) $category, $size, $hash, $mime);
    }

    /**
     * A fajlnevbol megjelenitesre alkalmas szoveg: konyvtar nelkul, vezerlo
     * karakterek es utvonal-elvalasztok nelkul, NFC alakban, legfeljebb 255
     * byte. Tarolasi utvonal SOHA nem keszul belole.
     */
    public static function safeName(string $name, int $maxBytes = self::MAX_NAME_BYTES): string
    {
        // Ervenytelen UTF-8 a kesobbi muveleteket (es a JSON-kodolast) torne el.
        $name = mb_scrub($name, 'UTF-8');
        $name = basename(str_replace('\\', '/', $name));
        $name = (string) preg_replace('/[\p{Cc}\p{Cf}\/\\\\]+/u', '', $name);
        $name = trim((string) preg_replace('/\s+/u', ' ', $name));

        if (class_exists(Normalizer::class)) {
            $normalized = Normalizer::normalize($name, Normalizer::FORM_C);
            $name = is_string($normalized) ? $normalized : $name;
        }

        if ($name === '' || $name === '.' || $name === '..') {
            return 'fajl';
        }

        if (strlen($name) <= $maxBytes) {
            return $name;
        }

        // Roviditesnel a kiterjesztes megmarad, a nev vege vesz el.
        $extension = pathinfo($name, PATHINFO_EXTENSION);
        $suffix = $extension === '' ? '' : '.'.$extension;
        $stem = $extension === '' ? $name : substr($name, 0, -strlen($suffix));

        return mb_strcut($stem, 0, max(1, $maxBytes - strlen($suffix)), 'UTF-8').$suffix;
    }

    /**
     * A nev utolso kiterjesztese kisbetuvel es ponttal (".xlsx"); ures, ha
     * nincs. Dupla kiterjesztesnel (a.xlsx.exe) az utolso szamit.
     */
    public static function extensionOf(string $name): string
    {
        $extension = pathinfo($name, PATHINFO_EXTENSION);

        return $extension === '' ? '' : '.'.mb_strtolower($extension);
    }

    /** A kiterjesztes meretkategoriaja (document, image, text, archive); null, ha a kiterjesztest sehol nem fogadjuk el. */
    public static function categoryOf(string $extension): ?string
    {
        $category = Config::array('filetasks.extensions')[mb_strtolower($extension)] ?? null;

        return is_string($category) ? $category : null;
    }

    /** Egy kategoria meretkorlatja byte-ban. */
    public static function maxBytesFor(string $category): int
    {
        return Config::integer('filetasks.max_bytes.'.$category);
    }

    /**
     * A FormRequest `max` szabalyahoz (kilobyte): a megadott kiterjesztesek
     * kozul a legnagyobb korlatu kategoria. A pontos, kiterjesztesenkenti
     * korlatot az inspect() ervenyesiti.
     *
     * @param  list<string>  $extensions
     */
    public static function maxKilobytesFor(array $extensions): int
    {
        $limits = [];

        foreach ($extensions as $extension) {
            $category = self::categoryOf($extension);

            if ($category !== null) {
                $limits[] = self::maxBytesFor($category);
            }
        }

        return $limits === [] ? 0 : intdiv(max($limits), 1024);
    }

    /**
     * @param  list<string>  $allowedExtensions
     * @return list<string>
     */
    private function accepted(array $allowedExtensions): array
    {
        $known = array_keys(Config::array('filetasks.extensions'));
        $blocked = Config::array('filetasks.blocked_extensions');

        return array_values(array_unique(array_filter(
            array_map(static fn (string $extension): string => mb_strtolower($extension), $allowedExtensions),
            static fn (string $extension): bool => in_array($extension, $known, true) && ! in_array($extension, $blocked, true),
        )));
    }

    private function sniff(string $path): string
    {
        $mime = (new finfo(FILEINFO_MIME_TYPE))->file($path);

        return is_string($mime) && $mime !== '' ? $mime : 'application/octet-stream';
    }

    /**
     * @throws UnsupportedUpload
     * @throws MacroEnabledFile
     */
    private function assertContentMatches(string $path, string $extension, string $mime): void
    {
        $head = (string) file_get_contents($path, false, null, 0, 8192);

        $matches = match (true) {
            in_array($extension, self::ZIP_EXTENSIONS, true) => $this->isZip($head, $mime),
            array_key_exists($extension, self::RASTER_MIME) => $mime === self::RASTER_MIME[$extension]
                && ($extension !== '.png' || str_starts_with($head, self::PNG_SIGNATURE)),
            $extension === '.svg' => $this->isText($head, $mime) && stripos((string) file_get_contents($path, false, null, 0, 65536), '<svg') !== false,
            default => $this->isText($head, $mime),
        };

        if (! $matches) {
            throw UnsupportedUpload::contentMismatch($extension);
        }

        if (in_array($extension, self::ZIP_EXTENSIONS, true)) {
            // Megnyitja es ellenorzi (bejegyzesszam, meretek, arany, nevek, makro), majd lezarja.
            $this->zipSafety->open($path)->close();
        }
    }

    private function isZip(string $head, string $mime): bool
    {
        if (! str_starts_with($head, self::ZIP_SIGNATURE)) {
            return false;
        }

        return in_array($mime, ['application/zip', 'application/x-zip-compressed', 'application/octet-stream'], true)
            || str_starts_with($mime, 'application/vnd.openxmlformats-officedocument.')
            || str_starts_with($mime, 'application/vnd.oasis.opendocument.');
    }

    /** Szoveg: a finfo szerint szoveges, es a fajl eleje nem tartalmaz NUL byte-ot. */
    private function isText(string $head, string $mime): bool
    {
        return (str_starts_with($mime, 'text/') || in_array($mime, self::TEXT_LIKE_MIME, true))
            && ! str_contains($head, "\0");
    }

    /**
     * Opcionalis viruskereso (FILETASKS_SCAN_COMMAND, pl. "clamdscan --no-summary {path}").
     *
     * @throws UnsupportedUpload ha a parancs nem nulla kilepesi koddal er veget
     */
    private function scan(string $path): void
    {
        $command = Config::get('filetasks.scan_command');

        if (! is_string($command) || trim($command) === '') {
            return;
        }

        try {
            $rejected = Process::timeout(self::SCAN_TIMEOUT_SECONDS)
                ->run(str_replace('{path}', escapeshellarg($path), $command))
                ->failed();
        } catch (ProcessTimedOutException) {
            // Ha a kereso nem valaszol, nem engedjuk at ellenorizetlenul.
            $rejected = true;
        }

        if ($rejected) {
            throw UnsupportedUpload::rejectedByScanner();
        }
    }
}
