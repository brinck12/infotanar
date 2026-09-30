<?php

declare(strict_types=1);

namespace App\Actions\Account;

use App\Actions\Audit\RecordAuditEvent;
use App\Enums\AuditAction;
use App\Models\AccessGrant;
use App\Models\LessonCompletion;
use App\Models\Submission;
use App\Models\Subscription;
use App\Models\User;

/**
 * GDPR 20. cikk (adathordozhatosag): a felhasznalo minden szemelyes adata
 * gepi uton olvashato formaban. Uj, felhasznalohoz kotott adat (pl.
 * haladas, elofizetes) bevezetesekor ide is fel kell venni.
 */
final readonly class ExportAccountData
{
    public function __construct(private RecordAuditEvent $audit) {}

    /** @return array<string, mixed> */
    public function handle(User $user, User $actor): array
    {
        $this->audit->handle(AuditAction::AccountExported, $actor, $user, [
            'on_behalf' => ! $actor->is($user),
        ]);

        return [
            'exported_at' => now()->toIso8601String(),
            'profile' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role->value,
                'email_verified_at' => $user->email_verified_at?->toIso8601String(),
                'registered_at' => $user->created_at?->toIso8601String(),
            ],
            'completed_lessons' => $user->lessonCompletions()
                ->with('lesson:id,title')
                ->oldest('completed_at')
                ->get()
                ->map(static fn (LessonCompletion $completion): array => [
                    'lesson' => ['id' => $completion->lesson_id, 'title' => $completion->lesson?->title],
                    'completed_at' => $completion->completed_at->toIso8601String(),
                ])
                ->all(),
            'submissions' => $user->submissions()
                ->with('exercise:id,title')
                ->oldest()
                ->get()
                ->map(static fn (Submission $submission): array => [
                    'id' => $submission->id,
                    'exercise' => ['id' => $submission->exercise_id, 'title' => $submission->exercise?->title],
                    'language' => $submission->language,
                    'status' => $submission->status,
                    'source_code' => $submission->source_code,
                    'results' => $submission->results,
                    'submitted_at' => $submission->created_at?->toIso8601String(),
                ])
                ->all(),
            // Csak allapot es datumok: a szolgaltatoi azonositok belso adatok, nem a felhasznaloe.
            'subscriptions' => $user->subscriptions()
                ->oldest()
                ->get()
                ->map(static fn (Subscription $subscription): array => [
                    'status' => $subscription->status->value,
                    'current_period_start' => $subscription->current_period_start?->toIso8601String(),
                    'current_period_end' => $subscription->current_period_end?->toIso8601String(),
                    'cancel_at_period_end' => $subscription->cancel_at_period_end,
                    'canceled_at' => $subscription->canceled_at?->toIso8601String(),
                    'created_at' => $subscription->created_at?->toIso8601String(),
                ])
                ->all(),
            // Kezi (osztondij/tamogatasi) hozzaferesek; az admin kilete belso adat, nem kerul bele.
            'access_grants' => $user->accessGrants()
                ->oldest()
                ->get()
                ->map(static fn (AccessGrant $grant): array => [
                    'reason' => $grant->reason,
                    'granted_at' => $grant->created_at?->toIso8601String(),
                    'ends_at' => $grant->ends_at?->toIso8601String(),
                    'revoked_at' => $grant->revoked_at?->toIso8601String(),
                ])
                ->all(),
        ];
    }
}
