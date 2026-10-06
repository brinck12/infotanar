<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Execution;

use App\Http\Controllers\Controller;
use App\Http\Resources\SubmissionDetailResource;
use App\Http\Resources\SubmissionSummaryResource;
use App\Models\Submission;
use App\Models\User;
use Illuminate\Container\Attributes\CurrentUser;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * A diak sajat beadasainak tortenete (#147). A beadas a diak munkaja, ezert
 * akkor is olvashato marad, ha a feladat kozben zarolt lett neki (lejart
 * elofizetes); a feladat szovege ettol meg zarolt marad.
 */
final class SubmissionHistoryController extends Controller
{
    private const PER_PAGE = 15;

    /** A lista-nezethez: a forraskod (akar tobb tiz KB soronkent) nelkul. */
    private const SUMMARY_COLUMNS = ['id', 'user_id', 'exercise_id', 'language', 'status', 'verdict', 'results', 'created_at'];

    /** A legutobbi beadasok, feladattol fuggetlenul. */
    public function index(#[CurrentUser] User $user): AnonymousResourceCollection
    {
        return SubmissionSummaryResource::collection(
            $this->history($user)->with('exercise:id,title')->cursorPaginate(self::PER_PAGE),
        );
    }

    /** Egy feladat beadasai. Ismeretlen feladatnal ures lista: masok feladatairol igy sem derul ki semmi. */
    public function forTask(#[CurrentUser] User $user, int $task): AnonymousResourceCollection
    {
        return SubmissionSummaryResource::collection(
            $this->history($user)->where('exercise_id', $task)->cursorPaginate(self::PER_PAGE),
        );
    }

    /** Mas beadasa 404, igy a letezese sem derul ki. */
    public function show(#[CurrentUser] User $user, int $submission): SubmissionDetailResource
    {
        $model = Submission::query()->with('exercise:id,title')->findOrFail($submission);

        abort_unless($user->can('view', $model), 404);

        return SubmissionDetailResource::make($model);
    }

    /** @return HasMany<Submission, User> */
    private function history(User $user): HasMany
    {
        return $user->submissions()->select(self::SUMMARY_COLUMNS)->latest('id');
    }
}
