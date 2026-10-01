<?php

declare(strict_types=1);

namespace App\Actions\Billing\Invoicing;

use App\Actions\Audit\RecordAuditEvent;
use App\Enums\AuditAction;
use App\Enums\InvoiceStatus;
use App\Exceptions\Billing\InvoiceAlreadyIssued;
use App\Jobs\IssueInvoice;
use App\Models\Invoice;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Elakadt szamlak kezelese (#103): a vevo adatainak javitasa es ujrainditas.
 *
 * Az ujrainditas nem nullazza a kiserletek szamat, igy a kiallitas a
 * "rendelesszam alapjan elobb rakerdez" uton megy (IssuePendingInvoice):
 * ha a Szamlazz.hu-n megis keszult szamla, nem keszul masodik. Minden
 * javitas es ujrainditas a vegrehajto adminnal naplozott.
 */
final readonly class ManageFailedInvoice
{
    public function __construct(private RecordAuditEvent $audit) {}

    /**
     * @param  array<string, string|null>  $buyer  a teljes, javitott vevo-adat
     *
     * @throws InvoiceAlreadyIssued
     */
    public function correctBuyer(Invoice $invoice, array $buyer, User $admin): Invoice
    {
        return DB::transaction(function () use ($invoice, $buyer, $admin): Invoice {
            $locked = $this->lockOpen($invoice);
            $before = $locked->buyer;
            $after = [...$before, ...$buyer];
            $locked->forceFill(['buyer' => $after])->save();

            $changed = array_keys(array_filter($buyer, static fn (?string $value, string $key): bool => ($before[$key] ?? null) !== $value, ARRAY_FILTER_USE_BOTH));
            $this->audit->handle(AuditAction::InvoiceBuyerCorrected, $admin, $locked, ['changed' => $changed]);

            return $locked;
        });
    }

    /** @throws InvoiceAlreadyIssued */
    public function retry(Invoice $invoice, User $admin): Invoice
    {
        $retried = DB::transaction(function () use ($invoice, $admin): Invoice {
            $locked = $this->lockOpen($invoice);
            $previous = $locked->status;
            $locked->forceFill(['status' => InvoiceStatus::Pending])->save();

            $this->audit->handle(AuditAction::InvoiceRetried, $admin, $locked, [
                'previous_status' => $previous->value,
                'last_error' => $locked->last_error,
            ]);

            return $locked;
        });

        IssueInvoice::dispatch($retried->id);

        return $retried->refresh();
    }

    /** @throws InvoiceAlreadyIssued */
    private function lockOpen(Invoice $invoice): Invoice
    {
        $locked = Invoice::query()->lockForUpdate()->findOrFail($invoice->id);

        if ($locked->status === InvoiceStatus::Issued) {
            throw new InvoiceAlreadyIssued;
        }

        return $locked;
    }
}
