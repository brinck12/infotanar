<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Enums\SolutionStatus;
use App\Models\ExerciseSolution;
use App\Services\Learning\SolutionView;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * A mintamegoldas allapota a diaknak. A `solutions` mezo csak feloldott
 * allapotban van a valaszban; zarolt vagy megnyithato allapotban a szoveg
 * nem kerul ki, csak az, hogy mi kell a megnyitashoz.
 *
 * @property SolutionView $resource
 */
final class SolutionViewResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $state = $this->resource->state;

        return [
            'status' => $state->status->value,
            'failed_submissions' => $state->failedSubmissions,
            'required_failed_submissions' => $state->requiredFailedSubmissions,
            'solutions' => $this->when(
                $state->status === SolutionStatus::Unlocked,
                fn (): array => $this->resource->solutions
                    ->map(static fn (ExerciseSolution $solution): array => [
                        'language' => $solution->language,
                        'source_code' => $solution->source_code,
                        'explanation' => $solution->explanation,
                    ])
                    ->values()
                    ->all(),
            ),
        ];
    }
}
