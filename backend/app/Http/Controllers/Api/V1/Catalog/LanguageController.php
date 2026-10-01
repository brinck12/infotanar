<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Catalog;

use App\Http\Controllers\Controller;
use App\Services\Execution\ExecutionLimitResolver;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Config;

/**
 * A tamogatott nyelvek egyetlen forrasa (config/judge0.php): a kliens innen
 * veszi a cimket, a Monaco szerkeszto nyelvmodjat es a sajat korlat nelkuli
 * feladatokra ervenyes ido- es memoriakorlatot, nem kodolja be oket.
 */
final class LanguageController extends Controller
{
    public function index(ExecutionLimitResolver $limits): JsonResponse
    {
        $languages = [];

        foreach (Config::array('judge0.languages') as $key => $language) {
            if (! is_string($key) || ! is_array($language)) {
                continue;
            }

            $languages[] = [
                'key' => $key,
                'label' => is_string($language['label'] ?? null) ? $language['label'] : $key,
                'monaco' => is_string($language['monaco'] ?? null) ? $language['monaco'] : 'plaintext',
                // A sajat korlat nelkuli feladatokra ervenyes ertekek; az ido mar a nyelvi szorzoval.
                'default_limits' => $limits->defaultFor($key)->toArray(),
                'time_factor' => $limits->timeFactor($key),
            ];
        }

        return response()->json(['data' => $languages])->header('Cache-Control', 'public, max-age=3600');
    }
}
