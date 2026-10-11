<?php

declare(strict_types=1);

namespace App\Http\Requests\FileTasks;

use App\Models\Exercise;
use App\Services\Files\UploadedFileInspector;
use App\Services\FileTasks\AcceptedExtensions;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\UploadedFile;
use LogicException;

/**
 * Fajl beadasa egy feladathoz: multipart keres egyetlen `file` mezovel.
 *
 * Itt csak a mezo megletet es a durva meretkorlatot nezzuk, hogy a tul nagy
 * fajl magyar 422-t kapjon. A kiterjesztest, a tartalmat es a pontos
 * meretkorlatot az UploadedFileInspector ellenorzi (SubmitFileSolution): az
 * az egyetlen feltoltesi ellenorzo, ide nem masoljuk at a szabalyait.
 */
final class UploadFileSubmissionRequest extends FormRequest
{
    private ?Exercise $resolvedExercise = null;

    /** @return array<string, mixed> */
    public function rules(): array
    {
        // A feladat feloldasa itt tortenik eloszor: ismeretlen feladatnal a valasz 404, nem validacios hiba.
        $maxKilobytes = UploadedFileInspector::maxKilobytesFor(AcceptedExtensions::for($this->exercise()));

        return [
            'file' => ['required', 'file', ...($maxKilobytes > 0 ? ['max:'.$maxKilobytes] : [])],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'file.required' => __('filetasks.file_required'),
            'file.file' => __('filetasks.upload_failed'),
            'file.uploaded' => __('filetasks.upload_failed'),
            'file.max' => __('filetasks.too_large_for_request'),
        ];
    }

    /**
     * Az utvonal feladata, a leckejevel egyutt. Diaknak csak a publikalt
     * feladat letezik: a nem publikus es az ismeretlen egyarant 404.
     *
     * @throws ModelNotFoundException
     */
    public function exercise(): Exercise
    {
        $id = $this->route('exercise');

        return $this->resolvedExercise ??= Exercise::query()
            ->published()
            ->with('lesson')
            ->findOrFail(is_numeric($id) ? (int) $id : 0);
    }

    /** A validalt feltoltes. */
    public function upload(): UploadedFile
    {
        $file = $this->file('file');

        if (! $file instanceof UploadedFile) {
            throw new LogicException('A `file` mezo a validacio utan mindig egy feltoltott fajl.');
        }

        return $file;
    }
}
