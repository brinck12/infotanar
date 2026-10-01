<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Catalog;

use App\Exceptions\Access\PremiumContentLocked;
use App\Http\Controllers\Controller;
use App\Models\Exercise;
use App\Models\User;
use App\Services\Access\ContentAccess;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\HeaderUtils;
use Symfony\Component\HttpFoundation\Response;

/**
 * A feladathoz mellekelt adatfajlok letoltese (#152).
 *
 * Csak a kozos fajlok erhetok el. A tesztesethez kotott (rejtett adatot
 * tartalmazo) fajlokat itt nem keressuk, ezert veletlenul sem kerulhetnek ki.
 */
final class TaskFileController extends Controller
{
    public function __construct(private readonly ContentAccess $access) {}

    /** @throws PremiumContentLocked */
    public function show(Request $request, int $task, string $name): Response
    {
        $exercise = Exercise::query()->published()->with('lesson')->findOrFail($task);

        $user = $request->user('sanctum');
        $denial = $this->access->denialFor($user instanceof User ? $user : null, $exercise->lesson);
        if ($denial !== null) {
            throw new PremiumContentLocked($denial);
        }

        $file = $exercise->sharedFiles()->where('name', $name)->firstOrFail();

        return response($file->bytes(), 200, [
            // Letoltes, nem megjelenites: a fajl tartalmat a bongeszo nem ertelmezi (pl. HTML).
            'Content-Type' => 'application/octet-stream',
            'Content-Disposition' => HeaderUtils::makeDisposition(HeaderUtils::DISPOSITION_ATTACHMENT, $file->name),
            'X-Content-Type-Options' => 'nosniff',
            'Cache-Control' => 'private, max-age=600',
        ]);
    }
}
