<?php

declare(strict_types=1);

namespace App\Actions\Admin\Audit;

use App\Models\AuditLog;
use App\Services\Admin\Audit\AuditLogFilters;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\CursorPaginator;

/**
 * A naplo (audit_logs) oldala szurve, legfrissebb elol (#161). Csak olvas: a naplo
 * olvasasa maga nem naplozott, es nincs hozza modosito/torlo ut.
 *
 * Kurzoros lapozas: a tabla csak gyarapszik, ezert az oldalszamozas "odébbcsuszna"
 * uj bejegyzesekkel, a kurzor viszont stabil.
 */
final class ListAuditLogs
{
    /** @return CursorPaginator<int, AuditLog> */
    public function handle(AuditLogFilters $filters, int $perPage): CursorPaginator
    {
        return AuditLog::query()
            // A szereplo torolt (soft delete) fiok is lehet: az AuditLog::actor() withTrashed.
            ->with('actor')
            ->tap(fn (Builder $query) => $this->applyFilters($query, $filters))
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->cursorPaginate($perPage);
    }

    /** @param Builder<AuditLog> $query */
    private function applyFilters(Builder $query, AuditLogFilters $filters): void
    {
        $query
            ->when($filters->action, static fn (Builder $q, $action) => $q->where('action', $action->value))
            ->when($filters->actorId, static fn (Builder $q, int $actorId) => $q->where('actor_id', $actorId))
            ->when($filters->subjectType, static fn (Builder $q, string $type) => $q->where('subject_type', $type))
            ->when($filters->subjectId, static fn (Builder $q, int $id) => $q->where('subject_id', $id))
            ->when($filters->from, static fn (Builder $q, $from) => $q->where('created_at', '>=', $from))
            ->when($filters->to, static fn (Builder $q, $to) => $q->where('created_at', '<', $to));
    }
}
