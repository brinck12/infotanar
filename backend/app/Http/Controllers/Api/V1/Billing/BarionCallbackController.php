<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Billing;

use App\Http\Controllers\Controller;
use App\Jobs\SyncBarionPayment;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;

/**
 * A Barion ide jelez (CallbackUrl), ha egy fizetes allapota valtozik (#15).
 *
 * A hivas alairatlan, ezert csak jelzeskent kezeljuk: a torzsebol semmit nem
 * hasznalunk, a valodi allapotot a SyncPaymentState kerdezi le a Barion
 * API-bol. Hamis vagy ismeretlen azonosito igy legfeljebb egy felesleges
 * lekerdezest okoz. Mindig 200-at adunk (a Barion kulonben ujrakuldi), es a
 * feldolgozas sorban tortenik, hogy a 15 mp-es hatarido biztosan meglegyen.
 */
final class BarionCallbackController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $barionId = $request->query('paymentId', $request->input('PaymentId'));

        $payment = is_string($barionId) && $barionId !== '' && strlen($barionId) <= 100
            ? Payment::query()
                ->where('provider', Payment::PROVIDER_BARION)
                ->where('provider_payment_id', $barionId)
                ->first(['id', 'status'])
            : null;

        if ($payment === null) {
            Log::notice('Barion callback for an unknown payment ignored.');
        } elseif (! $payment->status->isFinal()) {
            SyncBarionPayment::dispatch($payment->id);
        }

        return response()->noContent(Response::HTTP_OK);
    }
}
