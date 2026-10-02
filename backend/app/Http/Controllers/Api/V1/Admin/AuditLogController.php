<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Actions\Admin\Audit\ListAuditLogs;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ListAuditLogsRequest;
use App\Http\Resources\Admin\AuditLogResource;
use App\Models\AuditLog;
use App\Services\Admin\Audit\AuditSubjectResolver;
use Illuminate\Http\JsonResponse;

/**
 * A naplo olvasasa (#161): csak lista. Nincs modosito vagy torlo vegpont, es az olvasas
 * maga nem naplozott.
 */
final class AuditLogController extends Controller
{
    public function index(ListAuditLogsRequest $request, ListAuditLogs $list, AuditSubjectResolver $subjects): JsonResponse
    {
        $page = $list->handle($request->filters(), $request->perPage());
        // A targyak feliratai az egesz oldalra egyszerre, tipusonkent egy lekerdezessel.
        $labels = $subjects->resolve($page->getCollection());

        return response()->json($page->through(static fn (AuditLog $log): AuditLogResource => new AuditLogResource($log, $labels[$log->id] ?? null)));
    }
}
