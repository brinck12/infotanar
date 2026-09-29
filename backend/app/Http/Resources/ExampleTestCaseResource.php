<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\TestCase;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin TestCase */
final class ExampleTestCaseResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'stdin' => (string) $this->stdin,
            'expected_stdout' => $this->expected_stdout,
        ];
    }
}
