<?php

declare(strict_types=1);

namespace App\Http\Resources\Admin;

use App\Models\Attachment;
use App\Services\Files\AttachmentUrls;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Csatolt fajl az admin feluleten. Az `url` rovid eletu, alairt admin URL:
 * minden szerepet letolt, a diaknak tiltottakat (`input`, `sample_solution`) is.
 *
 * @mixin Attachment
 */
final class AdminAttachmentResource extends JsonResource
{
    public function __construct(private readonly Attachment $attachment)
    {
        parent::__construct($attachment);
    }

    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'role' => $this->role,
            'name' => $this->name,
            'size' => $this->size,
            // Csak `input` szerepnel: a teszteset, amelynek a sajat bemenete.
            'test_case_id' => $this->test_case_id,
            'url' => resolve(AttachmentUrls::class)->forAdmin($this->attachment),
        ];
    }
}
