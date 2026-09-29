<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Actions\Progress\BuildProgressReport;
use App\Enums\SubscriptionStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ListUsersRequest;
use App\Http\Resources\Admin\AdminUserResource;
use App\Http\Resources\Progress\ProgressReportResource;
use App\Models\Lesson;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;

/**
 * Felhasznalok attekintese tamogatashoz/megfigyeleshez (#50): kereses,
 * szures, elofizetesi allapot es haladas egy pillantasra. Csak olvas.
 */
final class UserController extends Controller
{
    public function index(ListUsersRequest $request): JsonResponse
    {
        $totalLessons = $this->publishedLessonCount();

        $users = $this->withOverview(User::query())
            ->when($request->search(), static function (Builder $query, string $search): void {
                $like = '%'.addcslashes($search, '%_\\').'%';
                $query->where(static fn (Builder $q) => $q->where('name', 'like', $like)->orWhere('email', 'like', $like));
            })
            ->when($request->stringFilter('role'), static fn (Builder $q, string $role) => $q->where('role', $role))
            ->when($request->verified() !== null, fn (Builder $q) => $request->verified()
                ? $q->whereNotNull('email_verified_at')
                : $q->whereNull('email_verified_at'))
            ->when($request->stringFilter('subscription'), static fn (Builder $q, string $filter) => $filter === 'none'
                ? $q->whereDoesntHave('subscriptions', static fn (Builder $s) => $s->whereIn('status', SubscriptionStatus::live()))
                : $q->whereHas('subscriptions', static fn (Builder $s) => $s->where('status', $filter)))
            ->latest('id')
            ->paginate($request->perPage())
            ->withQueryString()
            ->through(static fn (User $user): AdminUserResource => new AdminUserResource($user, $totalLessons));

        return response()->json($users);
    }

    public function show(User $user, BuildProgressReport $buildReport): JsonResponse
    {
        $user = $this->withOverview(User::query())->withCount('submissions')->findOrFail($user->id);

        return response()->json(['data' => [
            ...(new AdminUserResource($user, $this->publishedLessonCount()))->resolve(),
            'submission_count' => $user->submissions_count,
            'progress_by_track' => ProgressReportResource::make($buildReport->handle($user))->resolve()['tracks'] ?? [],
        ]]);
    }

    /**
     * Elofizetes + a publikalt leckekre szamolt teljesitesek, egyetlen
     * lekerdezesben a teljes oldalra (nincs N+1).
     *
     * @param  Builder<User>  $query
     * @return Builder<User>
     */
    private function withOverview(Builder $query): Builder
    {
        return $query
            ->with(['liveSubscription', 'activeAccessGrant'])
            ->withCount(['lessonCompletions' => static fn (Builder $q) => $q->whereHas('lesson', static fn (Builder $l) => $l->where('is_published', true))]);
    }

    private function publishedLessonCount(): int
    {
        return Lesson::query()
            ->published()
            ->whereHas('module.track', static fn (Builder $track) => $track->where('is_published', true))
            ->count();
    }
}
