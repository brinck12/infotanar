<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TestCase extends Model
{
    use HasFactory;

    protected $fillable = ['task_id', 'stdin', 'expected_stdout', 'is_hidden', 'order'];

    protected function casts(): array
    {
        return [
            'is_hidden' => 'boolean',
            'order' => 'integer',
        ];
    }

    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }
}
