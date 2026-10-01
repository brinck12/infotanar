<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Catalog;

use App\Models\Exercise;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Config;
use Illuminate\Validation\Rule;

/**
 * Adatfajl feltoltese egy feladathoz (multipart/form-data). A `name` elhagyhato:
 * ilyenkor a feltoltott fajl eredeti neve lesz. A `test_case_id` megadasakor a
 * fajl csak annal a tesztesetnel van jelen (felulirja az azonos nevu kozos fajlt).
 */
final class ExerciseFileRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $upload = $this->file('file');

        if (! $this->filled('name') && $upload instanceof UploadedFile) {
            $this->merge(['name' => $upload->getClientOriginalName()]);
        }
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        $exercise = $this->route('exercise');

        return [
            'file' => ['required', 'file', 'max:'.Config::integer('judge0.files.max_size_kb')],
            'name' => [
                'required',
                'string',
                'regex:'.Config::string('judge0.files.name_pattern'),
                Rule::notIn(Config::array('judge0.files.reserved_names')),
            ],
            'test_case_id' => [
                'sometimes',
                'nullable',
                'integer',
                Rule::exists('test_cases', 'id')->where('exercise_id', $exercise instanceof Exercise ? $exercise->id : 0),
            ],
        ];
    }

    public function upload(): UploadedFile
    {
        $upload = $this->file('file');
        assert($upload instanceof UploadedFile, 'A "file" mezo validalt, igy mindig feltoltott fajl.');

        return $upload;
    }

    public function fileName(): string
    {
        return $this->string('name')->toString();
    }

    public function testCaseId(): ?int
    {
        return $this->filled('test_case_id') ? $this->integer('test_case_id') : null;
    }
}
