<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Actions\Admin\Registration\ChangeRegistrationMode;
use App\Actions\Admin\Registration\CreateInviteCode;
use App\Actions\Admin\Registration\DisableInviteCode;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CreateInviteCodeRequest;
use App\Http\Requests\Admin\UpdateRegistrationModeRequest;
use App\Http\Resources\Admin\InviteCodeResource;
use App\Http\Resources\Admin\WaitlistEntryResource;
use App\Models\InviteCode;
use App\Models\User;
use App\Models\WaitlistEntry;
use App\Services\Registration\RegistrationGate;
use Illuminate\Container\Attributes\CurrentUser;
use Illuminate\Http\JsonResponse;

/** Zart beta regisztracios kapu admin felulete: mod, meghivokodok, varolista (LAUNCH-2). */
final class RegistrationGateController extends Controller
{
    public function mode(RegistrationGate $gate): JsonResponse
    {
        return response()->json(['data' => ['mode' => $gate->mode()->value]]);
    }

    public function updateMode(UpdateRegistrationModeRequest $request, #[CurrentUser] User $admin, ChangeRegistrationMode $change, RegistrationGate $gate): JsonResponse
    {
        $change->handle($request->mode(), $admin);

        return response()->json(['data' => ['mode' => $gate->mode()->value]]);
    }

    public function inviteCodes(): JsonResponse
    {
        $page = InviteCode::query()->with('createdBy:id,name')->latest('id')->paginate(25);

        return response()->json($page->through(static fn (InviteCode $invite): array => InviteCodeResource::make($invite)->resolve()));
    }

    public function createInviteCode(CreateInviteCodeRequest $request, #[CurrentUser] User $admin, CreateInviteCode $create): JsonResponse
    {
        $invite = $create->handle($admin, $request->label(), $request->maxUses(), $request->expiresAt(), $request->code());

        return InviteCodeResource::make($invite->load('createdBy:id,name'))->response()->setStatusCode(JsonResponse::HTTP_CREATED);
    }

    public function disableInviteCode(InviteCode $inviteCode, #[CurrentUser] User $admin, DisableInviteCode $disable): InviteCodeResource
    {
        return InviteCodeResource::make($disable->handle($inviteCode, $admin)->load('createdBy:id,name'));
    }

    public function waitlist(): JsonResponse
    {
        $page = WaitlistEntry::query()->latest('id')->paginate(50);

        return response()->json($page->through(static fn (WaitlistEntry $entry): array => WaitlistEntryResource::make($entry)->resolve()));
    }
}
