<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Execution;

use App\Actions\Execution\RunSolution;
use App\Actions\Execution\RunWithCustomInput;
use App\Http\Controllers\Controller;
use App\Http\Requests\Execution\RunCodeRequest;
use App\Http\Resources\EvaluationResource;

final class RunController extends Controller
{
    public function __invoke(RunCodeRequest $request, RunSolution $runSolution, RunWithCustomInput $runWithCustomInput): EvaluationResource
    {
        $result = $request->hasCustomInput()
            ? $runWithCustomInput->handle($request->exercise(), $request->language(), $request->sourceCode(), $request->customInput(), $request->optionalUser())
            : $runSolution->handle($request->exercise(), $request->language(), $request->sourceCode(), $request->optionalUser());

        return EvaluationResource::make($result);
    }
}
