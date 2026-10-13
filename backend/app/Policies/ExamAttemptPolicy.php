<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\ExamAttempt;
use App\Models\User;

/**
 * A vizsgaprobalkozas a diak sajat munkaja. A vezerlo a tiltast 404-kent adja
 * vissza, igy mas probalkozasanak a letezese sem derul ki.
 */
final class ExamAttemptPolicy
{
    /** A diak a sajatjat lathatja, az admin barkiet (tamogatasi keresekhez). */
    public function view(User $actor, ExamAttempt $attempt): bool
    {
        return $attempt->user_id === $actor->id || $actor->isAdmin();
    }

    /** Fajlt csak a probalkozas tulajdonosa tolthet fel. */
    public function upload(User $actor, ExamAttempt $attempt): bool
    {
        return $attempt->user_id === $actor->id;
    }

    /** Beadni is csak a tulajdonos tudja. */
    public function submit(User $actor, ExamAttempt $attempt): bool
    {
        return $attempt->user_id === $actor->id;
    }
}
