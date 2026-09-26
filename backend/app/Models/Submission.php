<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Submission extends Model
{
    use HasFactory;

    protected $fillable = ['user_id', 'task_id', 'language', 'source_code', 'status', 'results'];

    protected function casts(): array
    {
        return ['results' => 'array'];
    }

    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }
}
