<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Billing;

use App\Actions\Billing\Invoicing\DownloadInvoice;
use App\Http\Controllers\Controller;
use App\Http\Resources\PaymentResource;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Container\Attributes\CurrentUser;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response;

final class PaymentController extends Controller
{
    /** Sajat fizetesi tortenet (#17) a szamlakkal (#20), legujabb elol. */
    public function index(#[CurrentUser] User $user): AnonymousResourceCollection
    {
        return PaymentResource::collection(
            $user->payments()->with('invoice')->latest('id')->paginate(20),
        );
    }

    /**
     * A Barionrol visszatero oldal ezt kerdezi le, amig a fizetes vegleges
     * allapotba nem kerul. Mas felhasznalo fizeteset 404-gyel utasitja el,
     * igy a letezese sem derul ki.
     */
    public function show(#[CurrentUser] User $user, string $payment): PaymentResource
    {
        return new PaymentResource($this->own($user, $payment)->load('invoice'));
    }

    /** A fizeteshez kiallitott szamla PDF-je (#20), csak a tulajdonosnak. */
    public function invoice(#[CurrentUser] User $user, string $payment, DownloadInvoice $download): Response
    {
        return $download->handle($this->own($user, $payment));
    }

    private function own(User $user, string $requestId): Payment
    {
        return Payment::query()->whereBelongsTo($user)->where('request_id', $requestId)->firstOrFail();
    }
}
