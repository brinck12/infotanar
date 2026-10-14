<?php

declare(strict_types=1);

namespace App\Exceptions\FileTasks;

use App\Exceptions\DomainException;

/**
 * A feltoltott fajlt nem fogadjuk el: rossz kiterjesztes, a tartalom nem az,
 * aminek a kiterjesztes mondja, nem biztonsagos archivum, ures fajl, vagy a
 * viruskereso elutasitotta. Az uzenet megmondja a diaknak, mit tegyen.
 */
final class UnsupportedUpload extends DomainException
{
    /**
     * A kiterjesztes nincs az elfogadottak kozott.
     *
     * @param  list<string>  $accepted  az elfogadott kiterjesztesek, ponttal
     */
    public static function extension(string $extension, array $accepted): self
    {
        return new self(__('filetasks.unsupported_extension', [
            'ext' => $extension === '' ? __('filetasks.no_extension') : $extension,
            'list' => implode(', ', $accepted),
        ]));
    }

    /** A tartalom nem felel meg a kiterjesztesnek (pl. atnevezett szovegfajl vagy program). */
    public static function contentMismatch(string $extension): self
    {
        return new self(__('filetasks.content_mismatch', ['ext' => $extension]));
    }

    /** Zip-bomba, veszelyes bejegyzesnev, titkositott vagy serult archivum. */
    public static function unsafeArchive(): self
    {
        return new self(__('filetasks.unsafe_archive'));
    }

    public static function emptyFile(): self
    {
        return new self(__('filetasks.empty_file'));
    }

    /** A feltoltes nem ert veget (megszakadt kapcsolat, PHP feltoltesi hiba). */
    public static function uploadFailed(): self
    {
        return new self(__('filetasks.upload_failed'));
    }

    public static function rejectedByScanner(): self
    {
        return new self(__('filetasks.rejected_by_scanner'));
    }

    public function status(): int
    {
        return 422;
    }

    public function errors(): array
    {
        return ['file' => [$this->getMessage()]];
    }
}
