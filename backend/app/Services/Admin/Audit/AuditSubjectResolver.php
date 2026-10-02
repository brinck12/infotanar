<?php

declare(strict_types=1);

namespace App\Services\Admin\Audit;

use App\Models\AuditLog;
use App\Models\Exercise;
use App\Models\Invoice;
use App\Models\Lesson;
use App\Models\Module;
use App\Models\Subscription;
use App\Models\TestCase;
use App\Models\Track;
use App\Models\User;
use Illuminate\Support\Collection;

/**
 * A naplobejegyzesek targyanak feliratai es admin-linkjei (#161), egy oldalnyi bejegyzesre.
 *
 * Tipusonkent egyetlen lekerdezessel (tobbszoros morph betoltes helyett, ami bejegyzesenkent
 * kerdezne): az oldalon szereplo azonositokat gyujtjuk, es egyszerre toltjuk be. Egy mar
 * torolt targy felirata a naplo pillanatkepebol (`metadata.attributes.title`) jon, ha van.
 */
final class AuditSubjectResolver
{
    /**
     * @param  Collection<int, AuditLog>  $logs
     * @return array<int, AuditSubject> naplo-azonosito => targy (csak a targyas bejegyzesekre)
     */
    public function resolve(Collection $logs): array
    {
        $withSubject = $logs->filter(static fn (AuditLog $log): bool => $log->subject_type !== null && $log->subject_id !== null);

        /** @var array<string, array<int, array{label: string, path: ?string}>> $found */
        $found = [];
        foreach ($withSubject->groupBy('subject_type') as $type => $group) {
            $ids = array_values(array_unique(array_map(static fn (mixed $id): int => is_numeric($id) ? (int) $id : 0, $group->pluck('subject_id')->all())));
            $found[(string) $type] = $this->load((string) $type, $ids);
        }

        $subjects = [];
        foreach ($withSubject as $log) {
            $type = (string) $log->subject_type;
            $id = (int) $log->subject_id;
            $existing = $found[$type][$id] ?? null;

            $subjects[$log->id] = $existing !== null
                ? new AuditSubject($type, $id, $existing['label'], $existing['path'], true)
                : new AuditSubject($type, $id, $this->deletedLabel($type, $id, $log), null, false);
        }

        return $subjects;
    }

    /**
     * A meg letezo targyak, azonosito szerint.
     *
     * @param  list<int>  $ids
     * @return array<int, array{label: string, path: ?string}>
     */
    private function load(string $type, array $ids): array
    {
        return match ($type) {
            'user' => $this->users($ids),
            'track' => $this->titled(Track::class, $ids, '/admin/tananyag/agak/'),
            'module' => $this->titled(Module::class, $ids, '/admin/tananyag/modulok/'),
            'lesson' => $this->titled(Lesson::class, $ids, '/admin/tananyag/leckek/'),
            'exercise' => $this->titled(Exercise::class, $ids, '/admin/tananyag/feladatok/'),
            'test_case' => $this->testCases($ids),
            'subscription' => $this->subscriptions($ids),
            'invoice' => $this->invoices($ids),
            default => [],
        };
    }

    /**
     * @param  class-string<Track|Module|Lesson|Exercise>  $modelClass
     * @param  list<int>  $ids
     * @return array<int, array{label: string, path: ?string}>
     */
    private function titled(string $modelClass, array $ids, string $pathPrefix): array
    {
        $found = [];
        foreach ($modelClass::query()->whereIn('id', $ids)->get(['id', 'title']) as $model) {
            $id = $model->getKey();
            $title = $model->getAttribute('title');
            if (is_int($id)) {
                $found[$id] = ['label' => is_string($title) ? $title : '', 'path' => $pathPrefix.$id];
            }
        }

        return $found;
    }

    /**
     * @param  list<int>  $ids
     * @return array<int, array{label: string, path: ?string}>
     */
    private function users(array $ids): array
    {
        $found = [];
        foreach (User::withTrashed()->whereIn('id', $ids)->get(['id', 'name', 'email', 'deleted_at']) as $user) {
            // A torolt fiok neve/e-mailje mar anonimizalt: a nev maga jelzi ("Torolt felhasznalo").
            $found[$user->id] = ['label' => $user->trashed() ? $user->name : "{$user->name} ({$user->email})", 'path' => '/admin/felhasznalok/'.$user->id];
        }

        return $found;
    }

    /**
     * @param  list<int>  $ids
     * @return array<int, array{label: string, path: ?string}>
     */
    private function testCases(array $ids): array
    {
        $found = [];
        foreach (TestCase::query()->whereIn('id', $ids)->with('exercise:id,title')->get(['id', 'exercise_id']) as $testCase) {
            $exercise = $testCase->exercise;
            $found[$testCase->id] = [
                'label' => sprintf('Teszteset #%d – %s', $testCase->id, $exercise->title),
                'path' => '/admin/tananyag/feladatok/'.$exercise->id,
            ];
        }

        return $found;
    }

    /**
     * @param  list<int>  $ids
     * @return array<int, array{label: string, path: ?string}>
     */
    private function subscriptions(array $ids): array
    {
        $subscriptions = Subscription::query()->whereIn('id', $ids)->get(['id', 'user_id']);
        $names = User::withTrashed()->whereIn('id', $subscriptions->pluck('user_id'))->pluck('name', 'id');

        $found = [];
        foreach ($subscriptions as $subscription) {
            $found[$subscription->id] = [
                'label' => sprintf('Előfizetés #%d – %s', $subscription->id, is_string($names[$subscription->user_id] ?? null) ? $names[$subscription->user_id] : '?'),
                'path' => '/admin/felhasznalok/'.$subscription->user_id,
            ];
        }

        return $found;
    }

    /**
     * @param  list<int>  $ids
     * @return array<int, array{label: string, path: ?string}>
     */
    private function invoices(array $ids): array
    {
        $found = [];
        foreach (Invoice::query()->whereIn('id', $ids)->get(['id', 'invoice_number']) as $invoice) {
            $found[$invoice->id] = ['label' => 'Számla '.($invoice->invoice_number ?? '#'.$invoice->id), 'path' => '/admin/szamlak'];
        }

        return $found;
    }

    /** Torolt targy: tipus + azonosito, a naplo pillanatkepenek cimevel, ha van. */
    private function deletedLabel(string $type, int $id, AuditLog $log): string
    {
        $typeLabel = __("admin.audit.subjects.{$type}");
        $snapshot = data_get($log->metadata, 'attributes.title');

        return is_string($snapshot) && $snapshot !== ''
            ? sprintf('%s „%s” (#%d)', $typeLabel, $snapshot, $id)
            : sprintf('%s #%d', $typeLabel, $id);
    }
}
