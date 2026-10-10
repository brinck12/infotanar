<?php

declare(strict_types=1);

namespace App\Actions\Admin\Users;

use App\Actions\Audit\RecordAuditEvent;
use App\Actions\Billing\Invoicing\DownloadInvoice;
use App\Enums\AuditAction;
use App\Exceptions\Billing\InvoiceUnavailable;
use App\Models\User;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Egy felhasznalo szamlajanak letoltese ugyfelszolgalatnak. A szamla vevoi
 * adatot tartalmaz, ezert minden letoltes naplozott; a PDF tartalma nem.
 */
final readonly class DownloadUserInvoice
{
    public function __construct(private DownloadInvoice $download, private RecordAuditEvent $audit) {}

    /** @throws InvoiceUnavailable */
    public function handle(User $user, string $paymentRequestId, User $actor): StreamedResponse
    {
        $payment = $user->payments()->with('invoice')->where('request_id', $paymentRequestId)->firstOrFail();

        $response = $this->download->handle($payment);

        $this->audit->handle(AuditAction::InvoiceDownloaded, $actor, $payment->invoice, [
            'invoice_number' => $payment->invoice?->invoice_number,
            'for_user_id' => $user->id,
        ]);

        return $response;
    }
}
