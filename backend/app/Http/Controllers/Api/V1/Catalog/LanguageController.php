<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Catalog;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Config;

/**
 * A tamogatott nyelvek egyetlen forrasa (config/judge0.php): a kliens innen
 * veszi a cimket es a Monaco szerkeszto nyelvmodjat, nem kodolja be oket.
 */
final class LanguageController extends Controller
{
    public function index(): JsonResponse
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
            ];
        }

        return response()->json(['data' => $languages])->header('Cache-Control', 'public, max-age=3600');
    }
}
