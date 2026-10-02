<?php

declare(strict_types=1);

namespace App\Http\Resources\Admin;

use App\Models\LessonUpload;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Egy folyamatban levo videofeltoltes allapota: a kliens ebbol tudja, mekkora
 * darabokat kuldjon, es megszakadas utan mely darabokat kell meg pótolnia.
 *
 * @property LessonUpload $resource
 */
final class LessonUploadResource extends JsonResource
{
    /** @param list<int> $receivedParts */
    public function __construct(LessonUpload $upload, private readonly array $receivedParts = [])
    {
        parent::__construct($upload);
    }

    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            'lesson_id' => $this->resource->lesson_id,
            'filename' => $this->resource->filename,
            'size' => $this->resource->size,
            'part_size' => $this->resource->part_size,
            'total_parts' => $this->resource->total_parts,
            'received_parts' => $this->receivedParts,
        ];
    }
}
