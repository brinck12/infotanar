<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

final class Topic extends Model
{
    protected $fillable = ['name', 'slug'];

    /** @return HasMany<Task, $this> */
    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }
}
