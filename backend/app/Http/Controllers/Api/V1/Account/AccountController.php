<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Account;

use App\Actions\Account\DeleteAccount;
use App\Actions\Account\ExportAccountData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Account\DeleteAccountRequest;
use App\Http\Responses\AccountExportResponse;
use App\Models\User;
use Illuminate\Container\Attributes\CurrentUser;
use Illuminate\Http\Response;

/** A bejelentkezett felhasznalo sajat adatai (GDPR 17. es 20. cikk). */
final class AccountController extends Controller
{
    public function export(#[CurrentUser] User $user, ExportAccountData $export): AccountExportResponse
    {
        return new AccountExportResponse($export->handle($user, actor: $user), $user);
    }

    public function destroy(DeleteAccountRequest $request, #[CurrentUser] User $user, DeleteAccount $deleteAccount): Response
    {
        $deleteAccount->handle($user, actor: $user);

        return response()->noContent();
    }
}
