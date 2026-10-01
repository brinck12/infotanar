<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Submission;
use App\Models\User;

final class SubmissionPolicy
{
    /** A beadas a diak sajat munkaja: o lathatja, es az admin (tamogatasi keresekhez). */
    public function view(User $actor, Submission $submission): bool
    {
        return $submission->user_id === $actor->id || $actor->isAdmin();
    }
}
