<?php

declare(strict_types=1);

namespace App\Services\Catalog\Spec;

use Illuminate\Validation\Rule;

/**
 * Bongeszos szovegszerkeszto gyakorlo (`doc_browser`): a kiindulo bekezdesek
 * es az ellenorzolista (a frontend `DocPracticeInfo` tipusa; a kiertekeles:
 * frontend/src/features/practice/doc/DocPracticeWorkspace.tsx).
 *
 *   { "paragraphs": ["Hyrox verseny", "A verseny nyolc szakaszból áll."],
 *     "checks": [{ "id": 1, "label": "A cím középre igazított", "paragraph": 0, "type": "align", "value": "center" }] }
 *
 * A `paragraph` a `paragraphs` 0-tol szamozott indexe.
 */
final class DocBrowserSpec extends KindSpec
{
    private CheckVariants $checks;

    public function __construct()
    {
        $this->checks = new CheckVariants(['id', 'label', 'paragraph', 'type'], [
            'align' => ['value' => CheckField::oneOf('left', 'center', 'right', 'justify')],
            'font_size' => ['value' => CheckField::integer(8, 72)],
            'bold' => [],
            'italic' => [],
            'underline' => [],
            'line_spacing' => ['value' => CheckField::number(0.5, 3)],
        ]);
    }

    public function keys(): array
    {
        return ['paragraphs', 'checks'];
    }

    public function rules(array $spec): array
    {
        return [
            'paragraphs' => ['required', 'array', 'list', 'min:1', 'max:30'],
            'paragraphs.*' => ['required', 'string', 'max:2000'],
            'checks' => ['sometimes', 'array', 'list', 'max:30'],
            'checks.*.id' => ['sometimes', 'nullable', 'integer', 'min:1', 'distinct'],
            'checks.*.label' => ['required', 'string', 'max:200'],
            'checks.*.paragraph' => ['required', 'integer', 'min:0'],
            'checks.*.type' => ['required', 'string', Rule::in($this->checks->types())],
            ...$this->checks->rules('checks', $spec['checks'] ?? null),
        ];
    }

    public function violations(array $spec): array
    {
        $count = count(SpecValue::items($spec['paragraphs'] ?? null));
        $violations = [];

        foreach (SpecValue::items($spec['checks'] ?? null) as $index => $check) {
            $paragraph = SpecValue::integer(SpecValue::map($check)['paragraph'] ?? null);

            if ($paragraph >= $count) {
                $violations["checks.{$index}.paragraph"] = __('catalog.spec.paragraph_missing', ['index' => $paragraph, 'count' => $count]);
            }
        }

        return $violations;
    }

    public function normalise(array $spec, array $previous = []): array
    {
        $checks = SpecValue::items($spec['checks'] ?? null);
        $ids = CheckIds::assign($checks, $previous['checks'] ?? null);

        return [
            'paragraphs' => SpecValue::strings($spec['paragraphs'] ?? null),
            'checks' => array_map(function (mixed $check, int $id): array {
                $common = SpecValue::map($check);

                return [
                    'id' => $id,
                    'label' => SpecValue::string($common['label'] ?? null),
                    'paragraph' => SpecValue::integer($common['paragraph'] ?? null),
                    ...$this->checks->values($check),
                ];
            }, $checks, $ids),
        ];
    }

    public function isComplete(array $spec): bool
    {
        return SpecValue::items($spec['paragraphs'] ?? null) !== [] && SpecValue::items($spec['checks'] ?? null) !== [];
    }
}
