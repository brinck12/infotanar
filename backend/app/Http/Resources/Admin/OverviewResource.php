<?php

declare(strict_types=1);

namespace App\Http\Resources\Admin;

use App\Actions\Admin\BuildOverview;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Lang;

/**
 * Az admin attekinto valasza. A szamok valtozatlanul mennek ki; a naplozott
 * muveletek itt kapjak meg a magyar cimkejuket (lang/hu/overview.php).
 *
 * @phpstan-import-type Overview from BuildOverview
 *
 * @property Overview $resource
 */
final class OverviewResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'users' => $this->resource['users'],
            'subscribers' => $this->resource['subscribers'],
            'invoices' => $this->resource['invoices'],
            'catalog' => $this->resource['catalog'],
            'recent_actions' => array_map(static fn (array $entry): array => [
                'id' => $entry['id'],
                'action' => $entry['action'],
                'label' => self::label($entry['action']),
                'actor' => $entry['actor'],
                'subject_type' => $entry['subject_type'],
                'subject_id' => $entry['subject_id'],
                'created_at' => $entry['created_at'],
            ], $this->resource['recent_actions']),
        ];
    }

    /** A muvelet cimkeje; cimke nelkuli (uj) muveletnel altalanos szoveg, nem a nyers kulcs. */
    private static function label(string $action): string
    {
        $key = "overview.actions.{$action}";

        return __(Lang::has($key) ? $key : 'overview.action_fallback');
    }
}
