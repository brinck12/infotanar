<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Submission;
use App\Services\Execution\HiddenResultRedactor;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Egy korabbi beadas teljes egeszeben (#147): a forraskoddal es az eredmenyekkel.
 * Az eredmenyek mar a mentes elott at vannak szurve; itt ujra atmennek a szuron,
 * hogy rejtett teszteset adata akkor se mehessen ki, ha egy regi sorban benne maradt.
 *
 * @mixin Submission
 */
final class SubmissionDetailResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            ...(new SubmissionSummaryResource($this->resource))->toArray($request),
            'source_code' => $this->source_code,
            'results' => app(HiddenResultRedactor::class)->redact($this->results ?? []),
        ];
    }
}
