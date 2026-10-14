<?php

declare(strict_types=1);

namespace App\Http\Requests\Learning;

use Closure;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Config;

/**
 * Egy szobeli temakor gyakorlasi allapotanak mentese. A frontend mindig a
 * teljes allapotot kuldi, ezert mindharom mezonek szerepelnie kell; ures
 * lista, ures jegyzet es ures onertekeles is ervenyes.
 *
 * A temakort (`{topic}`) az utvonal megkotese ellenorzi, nem ez az osztaly.
 */
final class UpdateOralPracticeRequest extends FormRequest
{
    // A leghosszabb vazlat is boven belefer; a frontend a vazlatpont indexet kuldi.
    private const MAX_OUTLINE_ITEMS = 30;

    private const MAX_NOTES_LENGTH = 5000;

    // Egy onertekelt szempont 0..4 pontot er (frontend: ORAL_SCORING).
    private const MAX_SCORE = 4;

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'checked' => ['present', 'list', 'max:'.self::MAX_OUTLINE_ITEMS],
            'checked.*' => ['integer', 'between:0,'.(self::MAX_OUTLINE_ITEMS - 1), 'distinct'],
            'notes' => ['present', 'nullable', 'string', 'max:'.self::MAX_NOTES_LENGTH],
            'scores' => ['present', 'array', $this->onlyKnownCriteria()],
            'scores.*' => ['integer', 'between:0,'.self::MAX_SCORE],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'present' => __('learning.validation.present'),
            'checked.list' => __('learning.validation.checked_list'),
            'checked.*.distinct' => __('learning.validation.checked_distinct'),
        ];
    }

    /** @return array<string, string> */
    public function attributes(): array
    {
        return [
            'checked' => __('learning.attributes.checked'),
            'checked.*' => __('learning.attributes.checked_item'),
            'notes' => __('learning.attributes.notes'),
            'scores' => __('learning.attributes.scores'),
            'scores.*' => __('learning.attributes.score'),
        ];
    }

    /**
     * A kipipalt vazlatpontok sorszamai, a kuldott sorrendben.
     *
     * @return list<int>
     */
    public function checked(): array
    {
        $checked = [];

        foreach ($this->array('checked') as $index) {
            if (is_numeric($index)) {
                $checked[] = (int) $index;
            }
        }

        return $checked;
    }

    /** A jegyzet; ures szoveg, ha a diak torolte. */
    public function notes(): string
    {
        return $this->string('notes')->toString();
    }

    /**
     * Az onertekeles: szempont -> pont.
     *
     * @return array<string, int>
     */
    public function scores(): array
    {
        $scores = [];

        foreach ($this->array('scores') as $criterion => $points) {
            if (is_numeric($points)) {
                $scores[(string) $criterion] = (int) $points;
            }
        }

        return $scores;
    }

    /**
     * Csak a config/learning.php `oral_self_criteria` szempontjai pontozhatok.
     * Sajat szabaly kell hozza, mert a szempontok neveben vesszo van, es a
     * beepitett `array:kulcs1,kulcs2` szabaly a vesszonel darabolna.
     *
     * @return Closure(string, mixed, Closure(string): mixed): void
     */
    private function onlyKnownCriteria(): Closure
    {
        return static function (string $attribute, mixed $value, Closure $fail): void {
            if (! is_array($value)) {
                return;
            }

            $known = Config::array('learning.oral_self_criteria');
            $unknown = array_filter(
                array_map(strval(...), array_keys($value)),
                static fn (string $criterion): bool => ! in_array($criterion, $known, true),
            );

            if ($unknown !== []) {
                $fail(__('learning.validation.unknown_criterion', ['criterion' => implode(', ', $unknown)]));
            }
        };
    }
}
