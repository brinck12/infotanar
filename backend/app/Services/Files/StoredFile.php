<?php

declare(strict_types=1);

namespace App\Services\Files;

/**
 * Egy privat tarolon levo fajl leiroja: hol van, es mit tudunk rola.
 *
 * Ez megy at a retegek kozott (PrivateFileStore, FileReader, letoltes), hogy
 * senkinek ne kelljen disk-nevet es utvonalat kulon hordoznia. Modellbol:
 * Attachment::storedFile(), FileSubmission::storedFile().
 */
final readonly class StoredFile
{
    public function __construct(
        public FileDisk $disk,
        /** Relativ utvonal a tarolon; veletlen nev, soha nem a felhasznalo altal adott. */
        public string $path,
        /** Megjelenitesi (letoltesi) nev; utvonal soha nem keszul belole. */
        public string $name,
        /** Kisbetus kiterjesztes ponttal, pl. ".xlsx"; ures, ha nincs. */
        public string $extension,
        /** Meret byte-ban. */
        public int $size,
        public string $sha256,
        /** A tartalombol megallapitott tipus; ahol nem taroljuk, altalanos binaris. */
        public string $mime = 'application/octet-stream',
    ) {}
}
