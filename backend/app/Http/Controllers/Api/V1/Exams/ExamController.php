<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Exams;

use App\Enums\AttachmentRole;
use App\Http\Controllers\Controller;
use App\Http\Resources\Exams\ExamDetailResource;
use App\Http\Resources\Exams\ExamSummaryResource;
use App\Models\Exam;
use App\Models\ExamAttempt;
use App\Models\User;
use App\Services\Exams\AttemptProgress;
use App\Services\Exams\AttemptView;
use App\Services\Exams\ExamAccess;
use Illuminate\Container\Attributes\CurrentUser;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Database\Query\Builder as QueryBuilder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Gyakorlo vizsgak a diak szemszogebol. A lista nyilvanos (eladja a vizsgakat),
 * a reszletek bejelentkezest kernek; a tartalom (szoveg, forrasfajlok) csak a
 * premium hozzaferesuek.
 */
final class ExamController extends Controller
{
    public function __construct(
        private readonly ExamAccess $access,
        private readonly AttemptView $view,
    ) {}

    /** A publikalt vizsgak, a legujabb idoszak elol; a bejelentkezettnek a legutobbi probalkozasaval. */
    public function index(Request $request): JsonResponse
    {
        $viewer = $request->user('sanctum');
        $exams = Exam::query()
            ->published()
            ->with('parts.exercise')
            ->orderByDesc('session')
            ->orderBy('level')
            ->orderBy('id')
            ->get();

        $progress = $viewer instanceof User ? $this->latestProgress($viewer, $exams) : [];

        return response()->json([
            'data' => $exams->map(static fn (Exam $exam): ExamSummaryResource => new ExamSummaryResource($exam, $progress[$exam->id] ?? null)),
        ]);
    }

    public function show(#[CurrentUser] User $viewer, int $exam): ExamDetailResource
    {
        $viewer->loadMissing(['liveSubscription', 'activeAccessGrant']);
        $unlocked = $this->access->allows($viewer);

        $model = Exam::query()
            ->with($unlocked ? [
                // A tesztesethez kotott bemenet es a mintamegoldas soha nem toltodik be: csak a nyilvanos forrasok.
                'parts.exercise.attachments' => static fn (Relation $attachments) => $attachments
                    ->whereNull('test_case_id')
                    ->where('role', AttachmentRole::Source->value),
                'attachments',
            ] : ['parts.exercise'])
            ->findOrFail($exam);

        // A nem publikalt vizsga diaknak nem letezik; az admin megnezheti.
        abort_unless($model->is_published || $viewer->isAdmin(), 404);

        return new ExamDetailResource($model, $unlocked, $this->latestProgress($viewer, new EloquentCollection([$model]))[$model->id] ?? null);
    }

    /**
     * A nezo legutobbi probalkozasa vizsgankent, egyetlen lekerdezessel.
     *
     * @param  EloquentCollection<int, Exam>  $exams  a `parts.exercise` betoltve
     * @return array<int, AttemptProgress> vizsga azonosito => allapot
     */
    private function latestProgress(User $viewer, EloquentCollection $exams): array
    {
        if ($exams->isEmpty()) {
            return [];
        }

        $attempts = ExamAttempt::query()
            ->whereIn('id', static fn (QueryBuilder $query) => $query
                ->from('exam_attempts')
                ->selectRaw('max(id)')
                ->where('user_id', $viewer->id)
                ->whereIn('exam_id', $exams->modelKeys())
                ->groupBy('exam_id'))
            ->get();

        foreach ($attempts as $attempt) {
            $attempt->setRelation('exam', $exams->firstWhere('id', $attempt->exam_id));
        }

        $progress = [];

        foreach ($this->view->many($attempts) as $view) {
            $progress[$view->attempt->exam_id] = $view;
        }

        return $progress;
    }
}
