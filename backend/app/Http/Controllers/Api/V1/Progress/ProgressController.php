<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Progress;

use App\Actions\Progress\BuildProgressReport;
use App\Http\Controllers\Controller;
use App\Http\Resources\Progress\ProgressReportResource;
use App\Models\User;
use Illuminate\Container\Attributes\CurrentUser;

final class ProgressController extends Controller
{
    public function __invoke(#[CurrentUser] User $user, BuildProgressReport $buildReport): ProgressReportResource
    {
        return ProgressReportResource::make($buildReport->handle($user));
    }
}
