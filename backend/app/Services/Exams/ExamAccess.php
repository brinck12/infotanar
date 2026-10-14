<?php

declare(strict_types=1);

namespace App\Services\Exams;

use App\Enums\AccessDenial;
use App\Models\User;
use App\Services\Access\ContentAccess;

/**
 * Ki erheti el egy gyakorlo vizsga tartalmat es inditthatja: a premium
 * szabaly (bejelentkezes, megerositett e-mail, elofizetes vagy kezi
 * hozzaferes; az admin mindig), a ContentAccess egyetlen szabalyabol.
 * A vizsgalista nyilvanos, hogy el lehessen adni; a tartalom nem.
 */
final readonly class ExamAccess
{
    public function __construct(private ContentAccess $access) {}

    /** null = hozzafer; kulonben az elutasitas oka. */
    public function denialFor(?User $user): ?AccessDenial
    {
        return $this->access->premiumDenialFor($user);
    }

    public function allows(?User $user): bool
    {
        return $this->denialFor($user) === null;
    }
}
