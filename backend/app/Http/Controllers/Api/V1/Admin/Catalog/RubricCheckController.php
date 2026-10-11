<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin\Catalog;

use App\Actions\Admin\Catalog\CheckRubric;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Catalog\RubricCheckRequest;
use App\Http\Resources\FileSubmissionResource;
use App\Models\Exercise;
use App\Models\User;
use Illuminate\Container\Attributes\CurrentUser;

/**
 * Ertekelolap-proba: a feladat ertekelolapja lefut egy feltoltott fajlon (vagy
 * a mintamegoldason), es az eredmeny a beadas alakjaban jon vissza. Semmi nem
 * tarolodik, beadas nem keletkezik.
 */
final class RubricCheckController extends Controller
{
    public function __invoke(RubricCheckRequest $request, Exercise $exercise, #[CurrentUser] User $admin, CheckRubric $check): FileSubmissionResource
    {
        return FileSubmissionResource::make($check->handle($exercise, $request->upload(), $admin));
    }
}
