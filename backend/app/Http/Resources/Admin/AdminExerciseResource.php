<?php

declare(strict_types=1);

namespace App\Http\Resources\Admin;

use App\Models\Exercise;
use App\Services\Catalog\Spec\ExerciseSpec;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use stdClass;

/** @mixin Exercise */
final class AdminExerciseResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'lesson_id' => $this->lesson_id,
            'position' => $this->position,
            'kind' => $this->kind,
            'title' => $this->title,
            'description' => $this->description,
            'level' => $this->level,
            'difficulty' => $this->difficulty,
            // Nem szerkesztos fajtanal ures lista.
            'allowed_languages' => $this->allowed_languages ?? [],
            'starter_code' => $this->starter_code ?: new stdClass,
            'constraints' => $this->constraints->toArray(),
            // A fajtahoz tartozo adatok teljes alakban (a `raw_points`-szal egyutt); null, ha nincs.
            'spec' => resolve(ExerciseSpec::class)->export($this->kind, $this->spec),
            // A kimenet osszehasonlitasanak modja; null = soronkenti egyezes.
            'comparison' => $this->comparison ?: null,
            'sql_order_sensitive' => $this->sql_order_sensitive,
            // A feladat sajat korlatai; null = a globalis alapertek ervenyes.
            'time_limit_ms' => $this->time_limit_ms,
            'memory_limit_kb' => $this->memory_limit_kb,
            'is_published' => $this->is_published,
            'test_case_count' => $this->whenCounted('testCases'),
            // Kod- es fajlbeadasok egyutt: a feladat fajtaja addig nem valthato, amig van diakadat.
            'submission_count' => $this->whenCounted('submissions', fn (int $codeSubmissions): int => $codeSubmissions + $this->file_submissions_count),
            'rubric_item_count' => $this->whenCounted('rubricItems'),
            // Csak a reszletes nezetben: minden szerep, a tesztesetek bemeneti fajljaival egyutt.
            'attachments' => AdminAttachmentResource::collection($this->whenLoaded('attachments')),
        ];
    }
}
