<?php

declare(strict_types=1);

namespace App\Services\Files;

use Illuminate\Support\Facades\Config;

/**
 * A ket privat fajltarolo logikai neve. A tenyleges Laravel-disk neve
 * konfiguracio (filetasks.disks), igy kesobb S3-kompatibilis tarolora
 * cserelheto kodmodositas nelkul.
 */
enum FileDisk: string
{
    /** Szerzoi tartalom: feladatok es vizsgak csatolmanyai (attachments.path). */
    case ExerciseFiles = 'exercise_files';

    /** A diakok feltoltott megoldasai (file_submissions.path). */
    case SubmissionFiles = 'submission_files';

    /** A Storage::disk() szamara hasznalhato disk-nev. */
    public function diskName(): string
    {
        return Config::string('filetasks.disks.'.$this->value);
    }
}
