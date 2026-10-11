<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Document;

use App\Exceptions\FileTasks\MacroEnabledFile;
use App\Exceptions\FileTasks\UnsupportedUpload;
use App\Services\Files\PrivateFileStore;
use App\Services\Files\StoredFile;
use App\Services\Files\ZipSafety;
use App\Services\FileTasks\FileReader;
use App\Services\FileTasks\OpenedFile;
use App\Services\FileTasks\UnreadableFile;
use ZipArchive;

/**
 * Szövegszerkesztői dokumentumok (docx, odt) olvasója. A fájlt egyszer
 * értelmezi DocumentModel-lé; a zip-et a ZipSafety nyitja és olvassa
 * (memóriába, korláttal), a XML-t az XmlSafety tölti be.
 */
final readonly class DocumentReader implements FileReader
{
    public function __construct(
        private PrivateFileStore $files,
        private ZipSafety $zips,
    ) {}

    /** @return list<string> */
    public function extensions(): array
    {
        return ['.docx', '.odt'];
    }

    public function open(StoredFile $file): OpenedFile
    {
        return $this->files->withLocalPath($file, fn (string $path): DocumentModel => $this->parse($path, $file->extension));
    }

    /** @throws UnreadableFile */
    private function parse(string $path, string $extension): DocumentModel
    {
        try {
            $zip = $this->zips->open($path);
        } catch (UnsupportedUpload|MacroEnabledFile $exception) {
            throw new UnreadableFile('A csomag nem biztonságos vagy nem zip.', $exception);
        }

        try {
            return $this->parseArchive($zip, $extension);
        } finally {
            $zip->close();
        }
    }

    /** @throws UnreadableFile */
    private function parseArchive(ZipArchive $zip, string $extension): DocumentModel
    {
        return $extension === '.odt'
            ? (new OdtParser($zip, $this->zips))->parse()
            : (new DocxParser($zip, $this->zips))->parse();
    }
}
