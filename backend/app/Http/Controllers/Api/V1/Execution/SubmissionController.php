<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Execution;

use App\Actions\Execution\SubmitSolution;
use App\Http\Controllers\Controller;
use App\Http\Requests\Execution\RunCodeRequest;
use App\Http\Resources\SubmissionResource;
use Illuminate\Http\JsonResponse;

final class SubmissionController extends Controller
{
    /** Ingyenes leckenel bejelentkezes nelkul is mukodik; ha van ervenyes token, a felhasznalohoz kotjuk. */
    public function store(RunCodeRequest $request, SubmitSolution $submitSolution): JsonResponse
    {
        $outcome = $submitSolution->handle(
            $request->exercise(),
            $request->language(),
            $request->sourceCode(),
            $request->optionalUser(),
        );

        // 200 (nem 201): a prototipus ota ez a szerzodes, a kliensek erre epulnek.
        return SubmissionResource::make($outcome)->response()->setStatusCode(JsonResponse::HTTP_OK);
    }
}
