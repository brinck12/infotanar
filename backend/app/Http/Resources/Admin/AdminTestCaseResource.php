<?php

declare(strict_types=1);

namespace App\Http\Resources\Admin;

use App\Models\TestCase;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Az admin a rejtett tesztesetek tartalmat is latja.
 *
 * @mixin TestCase
 */
final class AdminTestCaseResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'exercise_id' => $this->exercise_id,
            'order' => $this->order,
            'stdin' => (string) $this->stdin,
            'expected_stdout' => $this->expected_stdout,
            'is_hidden' => $this->is_hidden,
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
