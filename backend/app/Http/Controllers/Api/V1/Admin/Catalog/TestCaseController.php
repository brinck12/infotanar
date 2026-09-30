<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin\Catalog;

use App\Actions\Admin\Catalog\ManageTestCase;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Catalog\ReorderRequest;
use App\Http\Requests\Admin\Catalog\TestCaseRequest;
use App\Http\Resources\Admin\AdminTestCaseResource;
use App\Models\Exercise;
use App\Models\TestCase;
use App\Models\User;
use Illuminate\Container\Attributes\CurrentUser;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

final class TestCaseController extends Controller
{
    public function __construct(private readonly ManageTestCase $manage) {}

    public function index(Exercise $exercise): AnonymousResourceCollection
    {
        return AdminTestCaseResource::collection($exercise->testCases()->get());
    }

    public function store(TestCaseRequest $request, Exercise $exercise, #[CurrentUser] User $admin): JsonResponse
    {
        $testCase = $this->manage->create($exercise, $request->validated(), $admin);

        return AdminTestCaseResource::make($testCase)->response()->setStatusCode(JsonResponse::HTTP_CREATED);
    }

    public function show(TestCase $testCase): AdminTestCaseResource
    {
        return AdminTestCaseResource::make($testCase);
    }

    public function update(TestCaseRequest $request, TestCase $testCase, #[CurrentUser] User $admin): AdminTestCaseResource
    {
        return AdminTestCaseResource::make($this->manage->update($testCase, $request->validated(), $admin));
    }

    public function destroy(TestCase $testCase, #[CurrentUser] User $admin): Response
    {
        $this->manage->delete($testCase, $admin);

        return response()->noContent();
    }

    public function reorder(ReorderRequest $request, Exercise $exercise, #[CurrentUser] User $admin): Response
    {
        $this->manage->reorder($exercise, $request->ids(), $admin);

        return response()->noContent();
    }
}
