<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\CustomerType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property CustomerType $customer_type
 */
final class BillingProfile extends Model
{
    /** Egyelore csak belfoldi szamlazas (HUF, magyar cim). */
    public const COUNTRY_HU = 'HU';

    protected $fillable = [
        'customer_type', 'name', 'country', 'postal_code', 'city', 'address_line', 'tax_number',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'customer_type' => CustomerType::class,
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
