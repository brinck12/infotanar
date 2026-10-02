<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\Catalog\Media\VideoUploader;
use Illuminate\Console\Command;

/** A felbehagyott (befejezetlen) videofeltoltesek darabjainak torlese (#158). */
final class PruneLessonUploads extends Command
{
    protected $signature = 'lessons:prune-uploads';

    protected $description = 'Felbehagyott videófeltöltések darabjainak törlése';

    public function handle(VideoUploader $uploader): int
    {
        $this->info(sprintf('%d felbehagyott feltöltés törölve.', $uploader->pruneStale()));

        return self::SUCCESS;
    }
}
