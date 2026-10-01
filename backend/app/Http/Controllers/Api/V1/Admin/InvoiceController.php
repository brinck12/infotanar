<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Actions\Billing\Invoicing\ManageFailedInvoice;
use App\Enums\InvoiceStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CorrectInvoiceBuyerRequest;
use App\Http\Resources\Admin\AdminInvoiceResource;
use App\Models\Invoice;
use App\Models\User;
use Illuminate\Container\Attributes\CurrentUser;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/** Elakadt szamlak (#103): attekintes, vevo-javitas, ujrainditas. */
final class InvoiceController extends Controller
{
    public function __construct(private readonly ManageFailedInvoice $manage) {}

    /**
     * A figyelmet igenylo szamlak: a vegleg elutasitottak (failed), es a
     * napnal regebben fuggok (az automatikus ujraprobalas sem vitte at).
     */
    public function index(): AnonymousResourceCollection
    {
        $invoices = Invoice::query()
            ->with(['payment', 'user'])
            ->where(static fn (Builder $q) => $q
                ->where('status', InvoiceStatus::Failed)
                ->orWhere(static fn (Builder $p) => $p->where('status', InvoiceStatus::Pending)->where('created_at', '<', now()->subDay())))
            ->oldest('id')
            ->paginate(25);

        return AdminInvoiceResource::collection($invoices);
    }

    public function updateBuyer(CorrectInvoiceBuyerRequest $request, Invoice $invoice, #[CurrentUser] User $admin): AdminInvoiceResource
    {
        return new AdminInvoiceResource($this->manage->correctBuyer($invoice, $request->buyer(), $admin)->load(['payment', 'user']));
    }

    public function retry(Invoice $invoice, #[CurrentUser] User $admin): AdminInvoiceResource
    {
        return new AdminInvoiceResource($this->manage->retry($invoice, $admin)->load(['payment', 'user']));
    }
}
