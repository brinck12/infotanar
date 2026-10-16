<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Console\Commands\Concerns\ResolvesContentPath;
use App\Services\Catalog\Content\ContentExporter;
use App\Services\Catalog\Content\ContentExportException;
use Illuminate\Console\Command;

class ExportCatalogCommand extends Command
{
    use ResolvesContentPath;

    protected $signature = 'catalog:export
        {--path=content/catalog : A célkönyvtár (a repó gyökeréhez képest, vagy abszolút)}
        {--only= : Útvonal-előtag: <track>[/<modul>[/<lecke>]] (slugok)}
        {--force : Meglévő fájlok felülírása (a lesson.md felülvizsgálati jelölései megmaradnak)}';

    protected $description = 'A katalógus kiírása tartalmi fájlokba (Markdown/YAML), az import fordítottja';

    public function handle(ContentExporter $exporter): int
    {
        $root = $this->resolveRoot();

        try {
            $written = $exporter->export($root, (bool) $this->option('force'), $this->only());
        } catch (ContentExportException $e) {
            $this->error($e->getMessage());
            foreach ($e->files as $file) {
                $this->line($file);
            }

            return self::FAILURE;
        }

        foreach ($exporter->skipped() as $notice) {
            $this->line($notice);
        }

        if ($written === []) {
            $this->error((string) __('catalog_import.export_nothing'));

            return self::FAILURE;
        }

        $this->info((string) __('catalog_import.export_done', ['count' => count($written), 'root' => $root]));

        return self::SUCCESS;
    }
}
