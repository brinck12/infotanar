<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Presentation;

use App\Services\Files\PrivateFileStore;
use App\Services\Files\StoredFile;
use App\Services\Files\ZipSafety;
use App\Services\FileTasks\FileReader;
use App\Services\FileTasks\OpenedFile;
use App\Services\FileTasks\UnreadableFile;
use Illuminate\Contracts\Filesystem\FileNotFoundException;

/**
 * A bemutato fajlok (pptx, odp) olvasoja: a csomagot a ZipSafety-n at nyitja
 * meg, memoriaban olvassa, es PresentationModel-t ad. Lemezre nem csomagol ki,
 * a dian talalt semmit nem futtat vagy tolt le. A ZipSafety kivetelei (serult vagy
 * veszelyes csomag) a FileEvaluatornal `failed` eredmenyt adnak.
 */
final readonly class PresentationReader implements FileReader
{
    public function __construct(
        private PrivateFileStore $files,
        private ZipSafety $zips,
        private PptxParser $pptx,
        private OdpParser $odp,
    ) {}

    /** @return list<string> */
    public function extensions(): array
    {
        return ['.pptx', '.odp'];
    }

    public function open(StoredFile $file): OpenedFile
    {
        try {
            return $this->files->withLocalPath($file, function (string $path) use ($file): PresentationModel {
                $zip = $this->zips->open($path);

                try {
                    $package = new OoxmlPackage($zip, $this->zips);

                    return $file->extension === '.odp' ? $this->odp->parse($package) : $this->pptx->parse($package);
                } finally {
                    $zip->close();
                }
            });
        } catch (FileNotFoundException $exception) {
            throw new UnreadableFile('A bemutato csomagja nem nyithato meg.', $exception);
        }
    }
}
