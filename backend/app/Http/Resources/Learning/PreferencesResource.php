<?php

declare(strict_types=1);

namespace App\Http\Resources\Learning;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * A tanulasi celok. A meg soha nem mentett celok `data: null`-kent mennek ki
 * (a frontend ilyenkor az alapertekeit mutatja), ezert a `data` kulcsot ez az
 * osztaly irja ki: az alap csomagolas a null-bol ures tombot csinalna.
 */
final class PreferencesResource extends JsonResource
{
    /** @var string|null */
    public static $wrap = null;

    /** @param array{level: string, exam_period: string, language: string, weekly_hours: string}|null $preferences */
    public function __construct(private readonly ?array $preferences)
    {
        parent::__construct($preferences);
    }

    /** @return array{data: array{level: string, exam_period: string, language: string, weekly_hours: string}|null} */
    public function toArray(Request $request): array
    {
        if ($this->preferences === null) {
            return ['data' => null];
        }

        return [
            'data' => [
                'level' => $this->preferences['level'],
                'exam_period' => $this->preferences['exam_period'],
                'language' => $this->preferences['language'],
                'weekly_hours' => $this->preferences['weekly_hours'],
            ],
        ];
    }
}
