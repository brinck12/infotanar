<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Spreadsheet;

use App\Exceptions\FileTasks\MacroEnabledFile;
use App\Exceptions\FileTasks\UnsupportedUpload;
use App\Services\Files\PrivateFileStore;
use App\Services\Files\StoredFile;
use App\Services\Files\ZipSafety;
use App\Services\FileTasks\FileReader;
use App\Services\FileTasks\OpenedFile;
use App\Services\FileTasks\UnreadableFile;
use Illuminate\Contracts\Filesystem\FileNotFoundException;

/**
 * Tablazat-olvaso az `.xlsx` es az `.ods` fajlokhoz. A csomagot az
 * ellenorzott ZipSafety-vel nyitja meg, es a formatumnak megfelelo
 * elemzore bizza; az eredmeny egy formatumfuggetlen SpreadsheetModel.
 *
 * A fajlbol semmi nem fut le: nincs makro, kulso hivatkozas vagy URL-letoltes,
 * a kepleteket csak szovegkent olvassuk.
 */
final readonly class SpreadsheetReader implements FileReader
{
    public function __construct(
        private PrivateFileStore $files,
        private ZipSafety $zip,
        private XlsxParser $xlsx,
        private OdsParser $ods,
    ) {}

    public function extensions(): array
    {
        return ['.xlsx', '.ods'];
    }

    public function open(StoredFile $file): OpenedFile
    {
        try {
            return $this->files->withLocalPath($file, fn (string $path): SpreadsheetModel => $this->read($path, $file->extension));
        } catch (FileNotFoundException $exception) {
            throw new UnreadableFile('A fajl nem talalhato a taroloban.', $exception);
        }
    }

    /** @throws UnreadableFile */
    private function read(string $path, string $extension): SpreadsheetModel
    {
        try {
            $archive = $this->zip->open($path);
        } catch (UnsupportedUpload|MacroEnabledFile $exception) {
            // Feltoltesnel az inspector mar elutasitotta; a mintamegoldas vagy egy regi fajl itt bukhat el.
            throw new UnreadableFile('A csomag nem biztonsagos.', $exception);
        }

        try {
            return $extension === '.ods' ? $this->ods->parse($archive) : $this->xlsx->parse($archive);
        } finally {
            $archive->close();
        }
    }
}
