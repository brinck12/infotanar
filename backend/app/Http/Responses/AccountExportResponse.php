<?php

declare(strict_types=1);

namespace App\Http\Responses;

use App\Models\User;
use Illuminate\Contracts\Support\Responsable;
use Illuminate\Http\JsonResponse;

/** Letoltheto JSON fajl (Content-Disposition: attachment). */
final readonly class AccountExportResponse implements Responsable
{
    /** @param array<string, mixed> $data */
    public function __construct(private array $data, private User $user) {}

    public function toResponse($request): JsonResponse
    {
        $filename = sprintf('infotanar-adataim-%d-%s.json', $this->user->id, now()->format('Y-m-d'));

        return response()
            ->json($this->data, options: JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
            ->header('Content-Disposition', sprintf('attachment; filename="%s"', $filename))
            ->header('Cache-Control', 'no-store');
    }
}
