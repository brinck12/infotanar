<?php

declare(strict_types=1);

namespace App\Services\Files;

/**
 * Egy feltoltes, amely atment az UploadedFileInspector minden ellenorzesen,
 * de meg nincs eltarolva. A PrivateFileStore::put ebbol keszit StoredFile-t.
 */
final readonly class InspectedUpload
{
    public function __construct(
        /** A feltoltes ideiglenes fajlja a szerveren (a keres vegeig el). */
        public string $localPath,
        /** Megtisztitott megjelenitesi nev (UploadedFileInspector::safeName). */
        public string $name,
        /** Kisbetus kiterjesztes ponttal, pl. ".xlsx". */
        public string $extension,
        /** Meretkategoria: document, image, text vagy archive (filetasks.extensions). */
        public string $category,
        /** Meret byte-ban. */
        public int $size,
        public string $sha256,
        /** A tartalombol megallapitott tipus (finfo), nem a kliens allitasa. */
        public string $mime,
    ) {}
}
