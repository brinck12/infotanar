<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin\Catalog;

use App\Http\Controllers\Controller;
use App\Models\Exercise;
use App\Services\Catalog\ExerciseVerifier;
use Illuminate\Http\JsonResponse;

/**
 * "Kiprobalas mintamegoldassal": a feladat lefut a sajat mintamegoldasan, es a
 * valasz tesztesetenkent mutatja az eredmenyt (ugyanaz, mint a `catalog:verify`
 * parancs). Semmi nem tarolodik, beadas nem keletkezik.
 */
final class ExerciseVerifyController extends Controller
{
    public function __invoke(Exercise $exercise, ExerciseVerifier $verifier): JsonResponse
    {
        return response()->json(['data' => $verifier->verify($exercise)->toArray()]);
    }
}
