<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Catalog;

use App\Enums\AttachmentRole;
use App\Models\TestCase;
use App\Services\Files\UploadedFileInspector;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Config;
use Illuminate\Validation\Rule;
use LogicException;

/**
 * Fajl csatolasa feladathoz (multipart): `file`, `role`, es szereptol fuggoen
 * `test_case_id` es `name`.
 *
 * Itt csak a keres alakja dol el. A szerepenkenti szabalyokat (melyik fajta
 * mit fogad, kell-e teszteset, a nev mintaja, meret es darabszam) a
 * ManageAttachment ervenyesiti, a feladat soranak zarolasa alatt.
 */
final class AttachmentRequest extends FormRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'max:'.$this->maxKilobytes()],
            'role' => ['required', Rule::enum(AttachmentRole::class)->only(AttachmentRole::forExercises())],
            // Csak `input` szerepnel: a feladat sajat tesztesete.
            'test_case_id' => ['sometimes', 'nullable', 'integer', Rule::exists('test_cases', 'id')],
            // Ures = a feltoltott fajl eredeti neve.
            'name' => ['sometimes', 'nullable', 'string', 'max:100'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'file.file' => __('filetasks.upload_failed'),
            'file.uploaded' => __('filetasks.upload_failed'),
            'role.enum' => __('filetasks.attachment_role_not_allowed'),
        ];
    }

    public function role(): AttachmentRole
    {
        return $this->enum('role', AttachmentRole::class) ?? throw new LogicException('A role mezo a validacio utan mindig ervenyes.');
    }

    public function upload(): UploadedFile
    {
        $file = $this->file('file');

        return $file instanceof UploadedFile ? $file : throw new LogicException('A file mezo a validacio utan mindig egy feltoltott fajl.');
    }

    public function name(): ?string
    {
        return $this->string('name')->toString() ?: null;
    }

    /** A megadott teszteset; hogy a feladathoz tartozik-e, azt a ManageAttachment donti el. */
    public function testCase(): ?TestCase
    {
        $id = $this->integer('test_case_id');

        return $id > 0 ? TestCase::query()->find($id) : null;
    }

    /**
     * Durva felso korlat a `max` szabalyhoz: a legnagyobb meretkategoria, amely
     * feladathoz csatolhato (archivum nem). A szerep pontos korlatjat a
     * ManageAttachment ervenyesiti.
     */
    private function maxKilobytes(): int
    {
        $extensions = [];

        foreach (Config::array('filetasks.extensions') as $extension => $category) {
            if (is_string($extension) && $category !== 'archive') {
                $extensions[] = $extension;
            }
        }

        return UploadedFileInspector::maxKilobytesFor($extensions);
    }
}
