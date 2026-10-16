<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** Varolistara feliratkozott e-mail-cim (zart beta). */
final class WaitlistEntry extends Model
{
    public const UPDATED_AT = null;

    protected $fillable = ['email', 'note'];
}
