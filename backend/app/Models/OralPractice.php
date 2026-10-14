<?php

declare(strict_types=1);

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * A szobeli gyakorlas allapota egy temakorben: felhasznalonkent es
 * temakoronkent egy sor. A temakor tartalma a frontendben van; itt csak a
 * diak sajat allapota.
 *
 * @property int $id
 * @property int $user_id
 * @property string $topic A temakor slugja (config/learning.php `oral_topics`).
 * @property list<int> $checked A kipipalt vazlatpontok sorszamai.
 * @property string|null $notes A diak jegyzete; az API-ban ures szovegkent megy ki, ha NULL.
 * @property array<string, int> $scores Onertekeles: szempont -> 0..4.
 * @property int $attempts Hanyszor gyakorolta a temakort.
 * @property CarbonImmutable|Carbon|null $last_practiced_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read User $user
 */
final class OralPractice extends Model
{
    protected $fillable = ['user_id', 'topic', 'checked', 'notes', 'scores', 'attempts', 'last_practiced_at'];

    /**
     * A JSON oszlopoknak nincs adatbazis-alapertekuk (a MySQL nem engedi), ezert
     * az ures lista es az ures objektum innen jon.
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'checked' => '[]',
        'scores' => '{}',
        'attempts' => 0,
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'checked' => 'array',
            'scores' => 'array',
            'attempts' => 'integer',
            'last_practiced_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
