<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Execution;

use App\Actions\Execution\RunSolution;
use App\Http\Controllers\Controller;
use App\Http\Requests\Execution\RunCodeRequest;
use App\Http\Resources\EvaluationResource;

final class RunController extends Controller
{
    public function __invoke(RunCodeRequest $request, RunSolution $runSolution): EvaluationResource
    {
        return EvaluationResource::make(
            $runSolution->handle($request->task(), $request->language(), $request->sourceCode())
        );
    }
}
