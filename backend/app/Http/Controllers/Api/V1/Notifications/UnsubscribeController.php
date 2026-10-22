<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Notifications;

use App\Actions\Account\UnsubscribeWeeklySummary;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

final class UnsubscribeController extends Controller
{
    public function __invoke(int $id, UnsubscribeWeeklySummary $unsubscribe): JsonResponse
    {
        $unsubscribe->handle($id);

        return response()->json(['message' => __('rhythm.unsubscribe.done')]);
    }
}
