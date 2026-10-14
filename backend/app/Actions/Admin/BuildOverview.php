<?php

declare(strict_types=1);

namespace App\Actions\Admin;

use App\Enums\ExerciseKind;
use App\Enums\InvoiceStatus;
use App\Enums\SubscriptionStatus;
use App\Models\AuditLog;
use App\Models\Exam;
use App\Models\ExamPart;
use App\Models\Exercise;
use App\Models\Invoice;
use App\Models\Track;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Cache;

/**
 * Az admin attekinto szamai es a legutobbi naplozott muveletek (GET /admin/overview).
 *
 * Minden szam egy-egy aggregalo lekerdezes, felhasznalonkenti munka nincs: a
 * lekerdezesek szama az adatmennyisegtol fuggetlen. A szamok meghatarozasa
 * megegyezik azokeval a listakeval, amelyekre az oldal teendoi mutatnak
 * (felhasznalok szuroi, elakadt szamlak, kepzesi agak), igy a ketto nem terhet el.
 *
 * Az eredmeny csak skalarokbol allo tomb, ezert barmelyik cache-tarolon tarolhato.
 *
 * @phpstan-type RecentAction array{id: int, action: string, actor: array{id: int, name: string}|null, subject_type: string|null, subject_id: int|null, created_at: string}
 * @phpstan-type Overview array{
 *     users: array{total: int, unverified: int},
 *     subscribers: array{active: int, past_due: int},
 *     invoices: array{attention: int},
 *     catalog: array{tracks: int, draft_tracks: int, incomplete_rubrics: int, draft_exams: int},
 *     recent_actions: list<RecentAction>,
 * }
 */
final readonly class BuildOverview
{
    public const CACHE_KEY = 'admin.overview';

    private const CACHE_SECONDS = 60;

    private const RECENT_ACTIONS = 10;

    /** @return Overview */
    public function handle(): array
    {
        // Tesztkornyezetben nincs gyorsitotar: a tesztek a sajat valtoztatasuk utan
        // azonnal a friss szamokat varjak.
        if (App::environment('testing')) {
            return $this->build();
        }

        return Cache::remember(self::CACHE_KEY, self::CACHE_SECONDS, fn (): array => $this->build());
    }

    /** @return Overview */
    private function build(): array
    {
        return [
            // A torolt fiokok (soft delete) sehol nem szamitanak bele.
            'users' => [
                'total' => User::query()->count(),
                'unverified' => User::query()->whereNull('email_verified_at')->count(),
            ],
            'subscribers' => [
                'active' => $this->subscribers(SubscriptionStatus::Active),
                'past_due' => $this->subscribers(SubscriptionStatus::PastDue),
            ],
            'invoices' => [
                'attention' => $this->invoicesNeedingAttention(),
            ],
            'catalog' => [
                'tracks' => Track::query()->count(),
                'draft_tracks' => Track::query()->where('is_published', false)->count(),
                'incomplete_rubrics' => $this->incompleteRubrics(),
                'draft_exams' => Exam::query()->where('is_published', false)->count(),
            ],
            'recent_actions' => $this->recentActions(),
        ];
    }

    /**
     * Felhasznalok, akiknek ilyen allapotu elofizetese van. Ugyanaz, mint a
     * GET /admin/users `subscription` szuroje; elo elofizetesbol egy
     * felhasznalonak legfeljebb egy lehet.
     */
    private function subscribers(SubscriptionStatus $status): int
    {
        return User::query()
            ->whereHas('subscriptions', static fn (Builder $subscription) => $subscription->where('status', $status))
            ->count();
    }

    /**
     * A figyelmet igenylo szamlak: a vegleg elutasitottak es a napnal regebben
     * fuggok. Ugyanaz a meghatarozas, mint a GET /admin/invoices listaje
     * (Admin\InvoiceController::index); ha az valtozik, ezt is igazitani kell.
     */
    private function invoicesNeedingAttention(): int
    {
        return Invoice::query()
            ->where(static fn (Builder $invoice) => $invoice
                ->where('status', InvoiceStatus::Failed)
                ->orWhere(static fn (Builder $pending) => $pending
                    ->where('status', InvoiceStatus::Pending)
                    ->where('created_at', '<', now()->subDay())))
            ->count();
    }

    /**
     * Hany helyen hianyos az ertekelolap. Ket forrasbol all ossze, es egy feladat
     * akkor is egyszer szamit, ha mindkettoben vagy tobb vizsgareszben szerepel:
     *  - diaknak lathato feltoltos feladat egyetlen ertekelesi pont nelkul
     *    (a beadott fajl 0/0 pontot kapna);
     *  - vizsgaresz, amelynek az allapota hianyos (az admin vizsgaszerkeszto
     *    `rubric_status = incomplete` jelzese): ilyen resszel a vizsga nem publikalhato.
     * A feladat nelkuli vizsgaresz egyenkent szamit, mert nincs feladat, amihez kotheto.
     */
    private function incompleteRubrics(): int
    {
        $exercisesWithoutRubric = Exercise::query()
            ->published()
            ->whereIn('kind', array_filter(ExerciseKind::cases(), static fn (ExerciseKind $kind): bool => $kind->isUpload()))
            ->whereDoesntHave('rubricItems')
            ->pluck('id');

        // A vizsgareszek szama kicsi (vizsgankent nehany), es a szabalyhoz a feladat
        // `spec` JSON-ja is kell: a kiertekeles PHP-ban tortenik, nem JSON-utvonalas SQL-ben.
        $incompleteParts = ExamPart::query()
            ->with(['exercise' => static fn (Relation $exercise) => $exercise
                ->select(['id', 'kind', 'spec'])
                ->withSum('rubricItems', 'points')
                ->withExists('visibleTestCases')])
            ->get(['id', 'exercise_id', 'points'])
            ->filter(fn (ExamPart $part): bool => $this->isIncomplete($part));

        $exercises = $exercisesWithoutRubric
            ->merge($incompleteParts->pluck('exercise_id')->filter())
            ->unique()
            ->count();

        return $exercises + $incompleteParts->whereNull('exercise_id')->count();
    }

    /**
     * A vizsgaresz allapotanak szabalya (BACKEND.md 4.5.4): szerkesztos feladatnal
     * eleg egy nyilvanos teszteset; feltoltos feladatnal az ertekelolap
     * osszpontszamanak el kell ernie a celt, ami a feladat `spec.raw_points`
     * erteke, ennek hianyaban a resz pontszama. Minden mas hianyos: a feladat
     * nelkuli resz es a bongeszos feladat is.
     */
    private function isIncomplete(ExamPart $part): bool
    {
        $exercise = $part->exercise;

        if ($exercise === null) {
            return true;
        }

        if ($exercise->kind->isEditorBased()) {
            return $exercise->getAttribute('visible_test_cases_exists') !== true;
        }

        if (! $exercise->kind->isUpload()) {
            return true;
        }

        $rawPoints = $exercise->spec['raw_points'] ?? null;
        $target = is_numeric($rawPoints) ? (int) $rawPoints : $part->points;
        $rubricTotal = $exercise->getAttribute('rubric_items_sum_points');

        return (is_numeric($rubricTotal) ? (int) $rubricTotal : 0) < $target;
    }

    /**
     * A naplo legutobbi bejegyzesei, a legfrissebb elol. A szereplo NULL, ha a
     * muveletet a rendszer vegezte; torolt fiok a torleskor kapott nevvel latszik.
     *
     * @return list<RecentAction>
     */
    private function recentActions(): array
    {
        return array_values(AuditLog::query()
            ->with('actor:id,name')
            ->latest('id')
            ->limit(self::RECENT_ACTIONS)
            ->get()
            ->map(static fn (AuditLog $entry): array => [
                'id' => $entry->id,
                'action' => $entry->action->value,
                'actor' => $entry->actor === null ? null : ['id' => $entry->actor->id, 'name' => $entry->actor->name],
                'subject_type' => $entry->subject_type,
                'subject_id' => $entry->subject_id,
                'created_at' => $entry->created_at->toIso8601String(),
            ])
            ->all());
    }
}
