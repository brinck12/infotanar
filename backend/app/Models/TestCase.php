<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class TestCase extends Model
{
    protected $fillable = ['task_id', 'stdin', 'expected_stdout', 'is_hidden', 'order'];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'is_hidden' => 'boolean',
            'order' => 'integer',
        ];
    }

    /** @return BelongsTo<Task, $this> */
    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }
}
