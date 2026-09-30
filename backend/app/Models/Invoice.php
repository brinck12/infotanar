<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\InvoiceStatus;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property InvoiceStatus $status
 * @property array{customer_type: string, name: string, country: string, postal_code: string, city: string, address_line: string, tax_number: string|null, email: string} $buyer
 * @property CarbonImmutable|Carbon|null $issued_at
 */
final class Invoice extends Model
{
    public const PROVIDER_SZAMLAZZ = 'szamlazz';

    protected $fillable = [
        'payment_id', 'user_id', 'provider', 'status', 'invoice_number', 'buyer', 'vat_rate',
        'net_amount', 'vat_amount', 'gross_amount', 'currency', 'pdf_path', 'attempts', 'last_error', 'issued_at',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'status' => InvoiceStatus::class,
            'buyer' => 'array',
            'net_amount' => 'integer',
            'vat_amount' => 'integer',
            'gross_amount' => 'integer',
            'attempts' => 'integer',
            'issued_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<Payment, $this> */
    public function payment(): BelongsTo
    {
        return $this->belongsTo(Payment::class);
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class)->withTrashed();
    }
}
