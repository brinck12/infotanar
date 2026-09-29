<?php

declare(strict_types=1);

namespace App\Services\Access;

use App\Enums\AccessDenial;
use App\Models\Lesson;
use App\Models\User;

/**
 * A premium tartalomhoz valo hozzaferes egyetlen szabalya (PRD: "az ingyenes
 * leckek mindenkinek elerhetok"). Minden vegpont (lecke, video, futtatas,
 * beadas) ezt kerdezi, hogy a szabaly ne szoródjon szet a kodban.
 */
final class ContentAccess
{
    /** null = hozzafer; kulonben az elutasitas oka. */
    public function denialFor(?User $user, Lesson $lesson): ?AccessDenial
    {
        if ($lesson->is_free) {
            return null;
        }

        if ($user === null) {
            return AccessDenial::LoginRequired;
        }

        if ($user->isAdmin()) {
            return null;
        }

        if (! $user->hasVerifiedEmail()) {
            return AccessDenial::EmailUnverified;
        }

        return $user->hasPremiumAccess() ? null : AccessDenial::SubscriptionRequired;
    }

    public function allows(?User $user, Lesson $lesson): bool
    {
        return $this->denialFor($user, $lesson) === null;
    }
}
