<?php

declare(strict_types=1);

namespace App\Services\Catalog\Spec;

use Illuminate\Validation\Rule;

/**
 * Weboldal-feladat (`web`): a szerkesztheto fajlok kiindulo tartalommal es a
 * bongeszoben kiertekelt ellenorzesek (a frontend `WebTaskInfo` es `WebCheck`
 * tipusa; a kiertekeles: frontend/src/features/webtasks/checks.ts).
 *
 *   { "files": [{ "name": "index.html", "language": "html", "content": "<!DOCTYPE html>..." }],
 *     "checks": [{ "id": 1, "label": "Az oldal címe „Hyrox”", "points": 1, "hint": null, "type": "title", "value": "Hyrox" }],
 *     "exam_reference": null }
 */
final class WebSpec extends KindSpec
{
    /** A nev kiterjesztese => a szerkeszto nyelve. */
    private const LANGUAGES = ['html' => 'html', 'css' => 'css'];

    private CheckVariants $checks;

    public function __construct()
    {
        $this->checks = new CheckVariants(['id', 'label', 'points', 'hint', 'type'], [
            'title' => ['value' => CheckField::text(200)],
            'element_count' => [
                'file' => CheckField::text(40)->optional(),
                'selector' => CheckField::text(200),
                'count' => CheckField::integer(0, 1000),
            ],
            // A tulajdonsag neve a kliensen regularis kifejezesbe kerul, ezert csak CSS-nev lehet.
            'css_declaration' => ['property' => CheckField::text(60, '/^-{0,2}[A-Za-z][A-Za-z0-9-]*$/'), 'pattern' => CheckField::text(200)],
            'css_selector' => ['selector' => CheckField::text(200)],
            'link' => ['file' => CheckField::text(40)->optional(), 'href' => CheckField::text(300)],
        ]);
    }

    public function keys(): array
    {
        return ['files', 'checks', 'exam_reference'];
    }

    public function rules(array $spec): array
    {
        return [
            'files' => ['required', 'array', 'list', 'min:1', 'max:6'],
            'files.*' => ['array', new KnownKeys(['name', 'language', 'content'])],
            'files.*.name' => ['required', 'string', 'max:40', 'regex:/^[A-Za-z0-9._-]+\.(html|css)$/', 'distinct:ignore_case'],
            'files.*.language' => ['required', 'string', Rule::in(array_values(self::LANGUAGES))],
            // Ures kiindulo fajl is lehet (a keres ures szoveget nullra alakitja).
            'files.*.content' => ['nullable', 'string', 'max:50000'],
            // Ellenorzes nelkul a feladat mentheto, de nem publikalhato (isComplete).
            'checks' => ['sometimes', 'array', 'list', 'max:40'],
            'checks.*.id' => ['sometimes', 'nullable', 'integer', 'min:1', 'distinct'],
            'checks.*.label' => ['required', 'string', 'max:200'],
            'checks.*.points' => ['required', 'integer', 'between:1,20'],
            'checks.*.hint' => ['sometimes', 'nullable', 'string', 'max:300'],
            'checks.*.type' => ['required', 'string', Rule::in($this->checks->types())],
            ...$this->checks->rules('checks', $spec['checks'] ?? null),
            'exam_reference' => ['sometimes', 'nullable', 'string', 'max:100'],
        ];
    }

    public function violations(array $spec): array
    {
        $violations = [];
        $htmlFiles = [];

        foreach (SpecValue::items($spec['files'] ?? null) as $index => $file) {
            $file = SpecValue::map($file);
            $name = SpecValue::string($file['name'] ?? null);
            $language = self::LANGUAGES[pathinfo($name, PATHINFO_EXTENSION)] ?? null;

            if ($language !== ($file['language'] ?? null)) {
                $violations["files.{$index}.language"] = __('catalog.spec.web_language_mismatch', ['name' => $name]);
            }

            if ($language === 'html') {
                $htmlFiles[] = $name;
            }
        }

        if ($htmlFiles === []) {
            $violations['files'] = __('catalog.spec.web_needs_html');
        }

        foreach (SpecValue::items($spec['checks'] ?? null) as $index => $check) {
            $file = SpecValue::nullableString(SpecValue::map($check)['file'] ?? null);

            if ($file !== null && ! in_array($file, $htmlFiles, true)) {
                $violations["checks.{$index}.file"] = __('catalog.spec.web_unknown_file', ['file' => $file]);
            }
        }

        return $violations;
    }

    public function normalise(array $spec, array $previous = []): array
    {
        $checks = SpecValue::items($spec['checks'] ?? null);
        $ids = CheckIds::assign($checks, $previous['checks'] ?? null);

        return [
            'files' => array_map(static function (mixed $file): array {
                $file = SpecValue::map($file);

                return [
                    'name' => SpecValue::string($file['name'] ?? null),
                    'language' => SpecValue::string($file['language'] ?? null),
                    'content' => SpecValue::string($file['content'] ?? null),
                ];
            }, SpecValue::items($spec['files'] ?? null)),
            'checks' => array_map(function (mixed $check, int $id): array {
                $common = SpecValue::map($check);

                return [
                    'id' => $id,
                    'label' => SpecValue::string($common['label'] ?? null),
                    'points' => SpecValue::integer($common['points'] ?? null),
                    'hint' => SpecValue::nullableString($common['hint'] ?? null),
                    ...$this->checks->values($check),
                ];
            }, $checks, $ids),
            'exam_reference' => SpecValue::nullableString($spec['exam_reference'] ?? null),
        ];
    }

    public function isComplete(array $spec): bool
    {
        return SpecValue::items($spec['files'] ?? null) !== [] && SpecValue::items($spec['checks'] ?? null) !== [];
    }
}
