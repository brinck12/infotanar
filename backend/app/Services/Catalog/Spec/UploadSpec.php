<?php

declare(strict_types=1);

namespace App\Services\Catalog\Spec;

use App\Enums\ExerciseKind;
use App\Services\Files\UploadedFileInspector;
use Illuminate\Validation\Rule;

/**
 * Fajlfeltoltos feladat (`sheet_upload`, `doc_upload`, `visual_upload`): a
 * feladatlap teendoi es a beadando fajl leirasa (a frontend `FileTaskInfo`
 * tipusa). A forrasfajlok es a mintakep csatolmanyok, nem a spec reszei.
 *
 *   { "steps": ["Töltsd be a hyrox.txt fájlt."], "deliverable": "hyrox",
 *     "accepted_extensions": [".xlsx", ".ods"], "software": ["Excel"],
 *     "exam_reference": "2026. május, 3. feladat", "exam_points": 35, "raw_points": 70 }
 *
 * A `raw_points` (a hivatalos nyers maximum az atszamitas elott) csak az
 * ertekelolap teljessegehez es a vizsga-atszamitashoz kell: diaknak soha nem megy ki.
 */
final class UploadSpec extends KindSpec
{
    public function __construct(private readonly ExerciseKind $kind) {}

    public function keys(): array
    {
        return ['steps', 'deliverable', 'accepted_extensions', 'software', 'exam_reference', 'exam_points', 'raw_points'];
    }

    public function rules(array $spec): array
    {
        return [
            'steps' => ['sometimes', 'array', 'list', 'max:30'],
            'steps.*' => ['required', 'string', 'max:500'],
            // Kiterjesztes nelkul: a diak a sajat programja formatumaban menti.
            'deliverable' => ['sometimes', 'nullable', 'string', 'regex:/^[A-Za-z0-9_-]{1,40}$/'],
            'accepted_extensions' => ['required', 'array', 'list', 'min:1', 'max:6'],
            'accepted_extensions.*' => ['required', 'string', 'distinct', Rule::in($this->extensions())],
            'software' => ['sometimes', 'array', 'list', 'max:6'],
            'software.*' => ['required', 'string', 'max:40'],
            'exam_reference' => ['sometimes', 'nullable', 'string', 'max:100'],
            'exam_points' => ['sometimes', 'nullable', 'integer', 'between:1,200'],
            'raw_points' => ['sometimes', 'nullable', 'integer', 'between:1,400'],
        ];
    }

    public function normalise(array $spec, array $previous = []): array
    {
        return [
            'steps' => SpecValue::strings($spec['steps'] ?? null),
            'deliverable' => SpecValue::nullableString($spec['deliverable'] ?? null),
            'accepted_extensions' => SpecValue::strings($spec['accepted_extensions'] ?? null),
            'software' => SpecValue::strings($spec['software'] ?? null),
            'exam_reference' => SpecValue::nullableString($spec['exam_reference'] ?? null),
            'exam_points' => SpecValue::nullableInteger($spec['exam_points'] ?? null),
            'raw_points' => SpecValue::nullableInteger($spec['raw_points'] ?? null),
        ];
    }

    public function isComplete(array $spec): bool
    {
        return SpecValue::strings($spec['accepted_extensions'] ?? null) !== [];
    }

    /**
     * A fajtahoz illo kiterjesztesek kozul azok, amelyeket a feltoltes egyaltalan elfogad.
     *
     * @return list<string>
     */
    private function extensions(): array
    {
        return array_values(array_filter(
            $this->kind->uploadExtensions(),
            static fn (string $extension): bool => UploadedFileInspector::categoryOf($extension) !== null,
        ));
    }
}
