<?php

declare(strict_types=1);

namespace App\Actions\Admin\Catalog;

use App\Exceptions\Catalog\LessonNotPublishable;
use App\Models\Lesson;
use App\Models\User;
use App\Services\Catalog\LessonPublishing;
use Illuminate\Support\Facades\DB;

/**
 * Lecke modositasa (a `module_id` valtozasa athelyezes). A publikalas es a
 * tartalom (jegyzet, video) valtozasakor a lecke nem maradhat ures.
 */
final readonly class UpdateLesson
{
    private const PARENT = 'module_id';

    public function __construct(
        private ManageCatalogItem $catalog,
        private LessonPublishing $publishing,
    ) {}

    /**
     * @param  array<string, mixed>  $attributes  a LessonRequest::validated() eredmenye
     *
     * @throws LessonNotPublishable
     */
    public function handle(Lesson $lesson, array $attributes, User $admin): Lesson
    {
        return DB::transaction(function () use ($lesson, $attributes, $admin): Lesson {
            $locked = Lesson::query()->lockForUpdate()->findOrFail($lesson->id);
            $locked->fill($attributes);

            $this->publishing->assertPublishable($locked);

            return $this->catalog->update($locked, [], self::PARENT, $admin);
        });
    }
}
