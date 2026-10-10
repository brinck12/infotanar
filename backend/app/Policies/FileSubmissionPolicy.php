<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\FileSubmission;
use App\Models\User;

/**
 * A feltoltott fajl es az eredmenye a diak sajat munkaja. A vezerlo a
 * tiltast 404-kent adja vissza, igy mas beadasanak a letezese sem derul ki.
 */
final class FileSubmissionPolicy
{
    /** A diak a sajatjat lathatja, az admin barkiet (tamogatasi keresekhez). */
    public function view(User $actor, FileSubmission $submission): bool
    {
        return $submission->user_id === $actor->id || $actor->isAdmin();
    }

    /** A kezi pontokat csak a beado jelolheti: o veti ossze a munkajat a mintaval. */
    public function mark(User $actor, FileSubmission $submission): bool
    {
        return $submission->user_id === $actor->id;
    }
}
