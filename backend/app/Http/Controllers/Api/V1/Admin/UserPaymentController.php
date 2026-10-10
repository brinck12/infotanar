<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Actions\Admin\Users\DownloadUserInvoice;
use App\Http\Controllers\Controller;
use App\Http\Resources\Admin\AdminPaymentResource;
use App\Models\User;
use Illuminate\Container\Attributes\CurrentUser;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response;

/** Egy felhasznalo fizeteseinek es szamlainak megtekintese ugyfelszolgalatnak (#162). */
final class UserPaymentController extends Controller
{
    public function index(User $user): AnonymousResourceCollection
    {
        return AdminPaymentResource::collection(
            $user->payments()->with('invoice')->latest('id')->paginate(20),
        );
    }

    public function invoice(User $user, string $payment, #[CurrentUser] User $admin, DownloadUserInvoice $download): Response
    {
        return $download->handle($user, $payment, $admin);
    }
}
