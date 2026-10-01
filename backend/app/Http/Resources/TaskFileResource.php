<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\ExerciseFile;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * A diaknak megmutatott adatfajl: csak nev es meret. A tartalmat a
 * `GET /tasks/{id}/files/{name}` adja, hozzaferes-ellenorzessel.
 *
 * @mixin ExerciseFile
 */
final class TaskFileResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'name' => $this->name,
            'size' => $this->size,
        ];
    }
}
