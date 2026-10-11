<?php

declare(strict_types=1);

namespace App\Http\Requests\Learning;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Config;
use Illuminate\Validation\Rule;

/**
 * A tanulasi celok mentese: mind a negy mezo kotelezo, mert a frontend mindig
 * a teljes objektumot kuldi. A valaszthato ertekek a config/learning.php-ben
 * vannak (a frontend valasztolistainak tukre).
 */
final class UpdatePreferencesRequest extends FormRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'level' => ['required', 'string', Rule::in(['kozep', 'emelt'])],
            'exam_period' => ['required', 'string', Rule::in(Config::array('learning.exam_periods'))],
            'language' => ['required', 'string', Rule::in(Config::array('learning.languages'))],
            'weekly_hours' => ['required', 'string', Rule::in(Config::array('learning.weekly_hours'))],
        ];
    }

    /** @return array<string, string> */
    public function attributes(): array
    {
        return [
            'exam_period' => __('learning.attributes.exam_period'),
            'weekly_hours' => __('learning.attributes.weekly_hours'),
        ];
    }

    /**
     * Az ellenorzott celok, a tarolt alakban.
     *
     * @return array{level: string, exam_period: string, language: string, weekly_hours: string}
     */
    public function preferences(): array
    {
        return [
            'level' => $this->string('level')->toString(),
            'exam_period' => $this->string('exam_period')->toString(),
            'language' => $this->string('language')->toString(),
            'weekly_hours' => $this->string('weekly_hours')->toString(),
        ];
    }
}
