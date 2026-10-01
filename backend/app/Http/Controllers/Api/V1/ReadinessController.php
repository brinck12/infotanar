<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\Health\HealthStatus;
use App\Services\Health\ReadinessReport;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;

/**
 * Mukodik-e minden, amire az oldalnak szuksege van (#130). A /health csak azt
 * mutatja, hogy a PHP valaszol; ez az adatbazist, a sort, az utemezot es a
 * tobbi fuggoseget is megnezi. Hibanal 503, hogy a deploy es a monitorozas
 * a statuszkodbol is lassa.
 */
final class ReadinessController extends Controller
{
    public function __invoke(Request $request, ReadinessReport $report): JsonResponse
    {
        $readiness = $report->build();
        $ok = $readiness['status'] !== HealthStatus::Failed;

        // A reszletek (verziok, hibauzenetek, lemezhasznalat) nem publikusak.
        $body = $this->maySeeDetails($request)
            ? ['ok' => $ok, 'status' => $readiness['status']->value, 'checks' => $readiness['checks']]
            : ['ok' => $ok];

        return response()
            ->json($body, $ok ? JsonResponse::HTTP_OK : JsonResponse::HTTP_SERVICE_UNAVAILABLE)
            ->header('Cache-Control', 'no-store');
    }

    private function maySeeDetails(Request $request): bool
    {
        $expected = Config::get('health.token');
        $given = $request->header('X-Health-Token');

        if (is_string($expected) && $expected !== '' && is_string($given) && hash_equals($expected, $given)) {
            return true;
        }

        $user = $request->user('sanctum');

        return $user instanceof User && $user->isAdmin();
    }
}
