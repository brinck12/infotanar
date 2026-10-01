<?php

declare(strict_types=1);

namespace App\Actions\Execution;

use App\Exceptions\Access\PremiumContentLocked;
use App\Models\Exercise;
use App\Models\User;
use App\Services\Access\ContentAccess;
use App\Services\Execution\CustomInputRunner;
use App\Services\Execution\EvaluationResult;

/** "Saját bemenet": egy futtatas a diak bemenetevel, nem mentodik, tesztesetet nem erint. */
final readonly class RunWithCustomInput
{
    public function __construct(
        private CustomInputRunner $runner,
        private ContentAccess $access,
    ) {}

    /** @throws PremiumContentLocked */
    public function handle(Exercise $exercise, string $language, string $sourceCode, string $stdin, ?User $user): EvaluationResult
    {
        $denial = $this->access->denialFor($user, $exercise->lesson);
        if ($denial !== null) {
            throw new PremiumContentLocked($denial);
        }

        return $this->runner->run($exercise, $language, $sourceCode, $stdin);
    }
}
