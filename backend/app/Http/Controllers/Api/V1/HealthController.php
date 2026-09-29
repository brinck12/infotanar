<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class HealthController extends Controller
{
    /** Deploy utani smoke check vegpontja. */
    public function __invoke(): JsonResponse
    {
        return response()->json(['ok' => true]);
    }
}
