<?php

declare(strict_types=1);

namespace App\Services\Files;

use App\Exceptions\FileTasks\MacroEnabledFile;
use App\Exceptions\FileTasks\UnsupportedUpload;
use App\Services\FileTasks\UnreadableFile;
use Illuminate\Support\Facades\Config;
use ZipArchive;

/**
 * Zip-alapu fajlok (OOXML, ODF, forras-zip) biztonsagos kezelese.
 *
 * Soha nem csomagolunk ki lemezre: az olvasok a bejegyzeseket a read()
 * metodussal, kemeny byte-korlattal olvassak a memoriaba. Utvonal-bejaras
 * (path traversal) igy felepitesbol lehetetlen; a nevek ellenorzese csak
 * tobbszoros vedelem. A korlatok: config/filetasks.php `zip`.
 */
final class ZipSafety
{
    /** A makrot hordozo bejegyzes neve OOXML-ben (barmelyik mappaban). */
    private const VBA_PROJECT = 'vbaproject.bin';

    /** ODF: a Basic makrok es a szkriptek mappai a csomag gyokereben. */
    private const ODF_MACRO_FOLDERS = ['basic/', 'scripts/'];

    private const CONTENT_TYPES = '[Content_Types].xml';

    /**
     * Megnyitja (csak olvasasra) es ellenorzi az archivumot. A hivo zarja le (close()).
     *
     * @throws UnsupportedUpload ha a fajl nem ervenyes zip, vagy a tartalma nem biztonsagos
     * @throws MacroEnabledFile ha makrot tartalmaz
     */
    public function open(string $path): ZipArchive
    {
        $zip = new ZipArchive;

        if ($zip->open($path, ZipArchive::RDONLY) !== true) {
            throw UnsupportedUpload::unsafeArchive();
        }

        try {
            $this->assertSafe($zip);
        } catch (UnsupportedUpload|MacroEnabledFile $exception) {
            $zip->close();

            throw $exception;
        }

        return $zip;
    }

    /**
     * Zip-bomba, veszelyes bejegyzesnev, titkositas es makro elleni ellenorzes.
     * Csak a kozponti konyvtarat olvassa, tartalmat nem csomagol ki.
     *
     * @throws UnsupportedUpload ha a tartalom nem biztonsagos
     * @throws MacroEnabledFile ha makrot tartalmaz
     */
    public function assertSafe(ZipArchive $zip): void
    {
        $maxEntryBytes = Config::integer('filetasks.zip.max_entry_bytes');
        $maxRatio = Config::integer('filetasks.zip.max_ratio');
        $ratioFloor = Config::integer('filetasks.zip.ratio_floor_bytes');

        if ($zip->numFiles > Config::integer('filetasks.zip.max_entries')) {
            throw UnsupportedUpload::unsafeArchive();
        }

        $total = 0;

        for ($index = 0; $index < $zip->numFiles; $index++) {
            $entry = $zip->statIndex($index);

            if ($entry === false) {
                throw UnsupportedUpload::unsafeArchive();
            }

            $name = $entry['name'];
            $size = $entry['size'];
            $compressed = $entry['comp_size'];

            $this->assertSafeName($name);

            if ($entry['encryption_method'] !== ZipArchive::EM_NONE) {
                throw UnsupportedUpload::unsafeArchive();
            }

            $total += $size;

            if ($size > $maxEntryBytes || $total > Config::integer('filetasks.zip.max_total_bytes')) {
                throw UnsupportedUpload::unsafeArchive();
            }

            // Nulla tomoritett meret nem nulla tartalommal: a fejlec hazudik.
            if ($size >= $ratioFloor && ($compressed === 0 || $size / $compressed > $maxRatio)) {
                throw UnsupportedUpload::unsafeArchive();
            }

            if ($this->isMacroEntry($name)) {
                throw new MacroEnabledFile;
            }
        }

        if ($this->declaresMacros($zip)) {
            throw new MacroEnabledFile;
        }
    }

    /**
     * Egy bejegyzes tartalma a memoriaba, kemeny korlattal. A tenylegesen
     * beolvasott byte-okat szamolja, mert a fejlecben allo meret hazudhat.
     *
     * @param  int|null  $maxBytes  null = filetasks.xml_part_max_bytes
     * @return string|null null, ha nincs ilyen bejegyzes
     *
     * @throws UnreadableFile ha a bejegyzes nagyobb a korlatnal, vagy nem olvashato
     */
    public function read(ZipArchive $zip, string $name, ?int $maxBytes = null): ?string
    {
        if ($zip->locateName($name) === false) {
            return null;
        }

        $limit = $maxBytes ?? Config::integer('filetasks.xml_part_max_bytes');
        $stream = $zip->getStream($name);

        if ($stream === false) {
            throw new UnreadableFile("A(z) {$name} resz nem olvashato.");
        }

        try {
            // Eggyel tobbet kerunk a korlatnal: ha megjon, a resz tul nagy.
            $contents = stream_get_contents($stream, $limit + 1);
        } finally {
            fclose($stream);
        }

        if ($contents === false) {
            throw new UnreadableFile("A(z) {$name} resz nem olvashato.");
        }

        if (strlen($contents) > $limit) {
            throw new UnreadableFile("A(z) {$name} resz nagyobb a megengedettnel.");
        }

        return $contents;
    }

    /** @throws UnsupportedUpload */
    private function assertSafeName(string $name): void
    {
        $normalized = str_replace('\\', '/', $name);

        $unsafe = $name === ''
            || str_contains($name, "\0")
            || str_starts_with($normalized, '/')
            || preg_match('/^[A-Za-z]:/', $normalized) === 1
            || in_array('..', explode('/', $normalized), true);

        if ($unsafe) {
            throw UnsupportedUpload::unsafeArchive();
        }
    }

    private function isMacroEntry(string $name): bool
    {
        $lower = mb_strtolower(str_replace('\\', '/', $name));

        if (basename($lower) === self::VBA_PROJECT) {
            return true;
        }

        foreach (self::ODF_MACRO_FOLDERS as $folder) {
            // Ures mappa-bejegyzes onmagaban nem makro: csak a benne levo fajl szamit.
            if (str_starts_with($lower, $folder) && $lower !== $folder) {
                return true;
            }
        }

        return false;
    }

    /** OOXML: a makros dokumentum tartalomtipusa "macroEnabled", akkor is, ha a kiterjesztest atirtak. */
    private function declaresMacros(ZipArchive $zip): bool
    {
        try {
            $contentTypes = $this->read($zip, self::CONTENT_TYPES, 1024 * 1024);
        } catch (UnreadableFile) {
            return false;
        }

        return $contentTypes !== null && stripos($contentTypes, 'macroEnabled') !== false;
    }
}
