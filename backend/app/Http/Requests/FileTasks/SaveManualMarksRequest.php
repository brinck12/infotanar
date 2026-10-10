<?php

declare(strict_types=1);

namespace App\Http\Requests\FileTasks;

use Illuminate\Foundation\Http\FormRequest;

/**
 * A kezi pontok jelolese: `marks` = ertekelolap-pont azonositoja => megvan-e.
 *
 * Itt az alak szamit (nem ures objektum, szigoruan logikai ertekek). Hogy a
 * megnevezett tetel a beadas kezi pontja-e, azt a SaveManualMarks ellenorzi a
 * zarolt soron, mert a beadas eredmenyetol fugg.
 */
final class SaveManualMarksRequest extends FormRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'marks' => ['required', 'array', 'min:1'],
            // Szigoruan true/false: az "1", a 0 vagy az "igen" nem jeloles.
            'marks.*' => ['boolean:strict'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'marks.required' => __('filetasks.manual_marks_required'),
            'marks.array' => __('filetasks.manual_marks_required'),
            'marks.min' => __('filetasks.manual_marks_required'),
            'marks.*.boolean' => __('filetasks.manual_mark_not_boolean'),
        ];
    }

    /**
     * A jelolesek tetelazonosito szerint. A nem szam kulcs 0 lesz: ilyen
     * tetel nincs, igy a SaveManualMarks elutasitja.
     *
     * @return array<int, bool>
     */
    public function marks(): array
    {
        $marks = [];
        $input = $this->validated('marks');

        foreach (is_array($input) ? $input : [] as $id => $mark) {
            $marks[is_int($id) || ctype_digit($id) ? (int) $id : 0] = $mark === true;
        }

        return $marks;
    }
}
