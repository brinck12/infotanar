<?php

declare(strict_types=1);

namespace App\Http\Requests\Exams;

use App\Models\ExamAttempt;
use App\Models\ExamPart;
use App\Models\User;
use App\Services\Files\UploadedFileInspector;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Config;
use LogicException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * Fajl feltoltese egy vizsgareszhez: multipart keres egyetlen `file` mezovel.
 *
 * Itt csak a mezo megletet es a durva meretkorlatot nezzuk (a legnagyobb
 * dokumentum-keret), hogy a tul nagy fajl magyar 422-t kapjon. A kiterjesztest,
 * a tartalmat es a pontos korlatot az UploadedFileInspector ellenorzi
 * (UploadExamPartFile): az az egyetlen feltoltesi ellenorzo.
 */
final class UploadExamPartFileRequest extends FormRequest
{
    private ?ExamAttempt $resolvedAttempt = null;

    private ?ExamPart $resolvedPart = null;

    /**
     * A probalkozas es a resz feloldasa a validacio elott: idegen probalkozasra,
     * ismeretlen vagy mas vizsgahoz tartozo reszre 404 a valasz, a hianyzo fajl
     * 422-je elott, igy a hibakod nem arulja el, hogy az azonosito letezik-e.
     */
    protected function prepareForValidation(): void
    {
        $user = $this->user();
        $attemptId = $this->route('attempt');
        $partId = $this->route('part');

        $attempt = is_numeric($attemptId) ? ExamAttempt::query()->find((int) $attemptId) : null;

        if ($attempt === null || ! $user instanceof User || ! $user->can('upload', $attempt)) {
            throw new NotFoundHttpException;
        }

        $part = is_numeric($partId)
            ? ExamPart::query()->with('exercise')->where('exam_id', $attempt->exam_id)->find((int) $partId)
            : null;

        $this->resolvedAttempt = $attempt;
        $this->resolvedPart = $part ?? throw new NotFoundHttpException;
    }

    public function attempt(): ExamAttempt
    {
        return $this->resolvedAttempt ?? throw new LogicException('A probalkozas a validacio elott feloldodik.');
    }

    public function part(): ExamPart
    {
        return $this->resolvedPart ?? throw new LogicException('A resz a validacio elott feloldodik.');
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'max:'.$this->maxKilobytes()],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'file.required' => __('exams.file_required'),
            'file.file' => __('exams.upload_failed'),
            'file.uploaded' => __('exams.upload_failed'),
            'file.max' => __('exams.too_large_for_request'),
        ];
    }

    public function upload(): UploadedFile
    {
        $file = $this->file('file');

        return $file instanceof UploadedFile ? $file : throw new LogicException('A file mezo a validacio utan mindig egy feltoltott fajl.');
    }

    private function maxKilobytes(): int
    {
        $extensions = [];

        foreach (Config::array('filetasks.extensions') as $extension => $category) {
            if (is_string($extension) && $category !== 'archive' && $category !== 'text') {
                $extensions[] = $extension;
            }
        }

        return UploadedFileInspector::maxKilobytesFor($extensions);
    }
}
