<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Actions\Account\DeleteAccount;
use App\Actions\Account\ExportAccountData;
use App\Http\Controllers\Controller;
use App\Http\Responses\AccountExportResponse;
use App\Models\User;
use Illuminate\Container\Attributes\CurrentUser;
use Illuminate\Http\Response;

/**
 * GDPR kerelem teljesitese a felhasznalo neveben (pl. e-mailben erkezett
 * kerelemre). Minden hivas az audit naploba kerul, az admin azonositojaval.
 */
final class UserAccountController extends Controller
{
    public function export(User $user, #[CurrentUser] User $admin, ExportAccountData $export): AccountExportResponse
    {
        return new AccountExportResponse($export->handle($user, actor: $admin), $user);
    }

    public function destroy(User $user, #[CurrentUser] User $admin, DeleteAccount $deleteAccount): Response
    {
        $deleteAccount->handle($user, actor: $admin);

        return response()->noContent();
    }
}
