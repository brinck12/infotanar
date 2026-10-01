<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Enums\AccessDenial;
use App\Models\Exercise;
use App\Services\Catalog\TaskNavigation;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use stdClass;

/**
 * v1 reszletes nezet ("task"). Rejtett tesztesetbol csak a darabszam megy
 * ki, a tartalmuk soha. Zarolt (fizetos, jogosultsag nelkuli) feladatnal a
 * szoveg, a kiindulo kod es a peldak is kimaradnak: a kliens a `locked` es
 * a `locked_reason` alapjan mutat paywallt.
 *
 * @mixin Exercise
 */
final class TaskResource extends JsonResource
{
    public function __construct(
        Exercise $exercise,
        private readonly ?AccessDenial $denial = null,
        private readonly ?TaskNavigation $navigation = null,
    ) {
        parent::__construct($exercise);
    }

    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $unlocked = $this->denial === null;

        return [
            'id' => $this->id,
            'title' => $this->title,
            'level' => $this->level,
            'difficulty' => $this->difficulty,
            'allowed_languages' => $this->allowed_languages,
            'is_free' => $this->whenLoaded('lesson', fn () => $this->lesson->is_free),
            'locked' => ! $unlocked,
            'locked_reason' => $this->denial?->value,
            'locked_message' => $this->denial?->message(),
            'topic' => TopicResource::make($this->whenLoaded('lesson', fn () => $this->lesson->module)),
            // A videot a lejatszo kulon keri le (GET /lessons/{id}/video), rovid eletu URL-lel.
            'lesson' => $this->whenLoaded('lesson', fn (): array => [
                'id' => $this->lesson->id,
                'slug' => $this->lesson->slug,
                'track_slug' => $this->lesson->module?->track?->slug,
                'title' => $this->lesson->title,
                'has_video' => $this->lesson->video_path !== null,
            ]),
            'description' => $this->when($unlocked, fn () => $this->description),
            // A diaknak elore lathato szabalyok, magyarul (pl. "for ciklust kell használnod").
            'constraints' => $this->when($unlocked, fn (): array => $this->constraints->describe()),
            // Ures objektum (nem ures tomb), hogy a kliens mindig map-kent kezelhesse.
            'starter_code' => $this->when($unlocked, fn () => $this->starter_code ?: new stdClass),
            'example_test_cases' => $this->when(
                $unlocked,
                fn () => ExampleTestCaseResource::collection($this->whenLoaded('visibleTestCases')),
            ),
            'hidden_test_case_count' => $this->whenCounted('hiddenTestCases'),
            // Zarolt feladatnal is megy: a diak onnan is tovabb tud lepni.
            'navigation' => $this->when($this->navigation !== null, fn (): ?array => $this->navigation?->toArray()),
        ];
    }
}
