<?php

declare(strict_types=1);

namespace App\Actions\Admin\Catalog;

use App\Exceptions\Catalog\LessonNotPublishable;
use App\Models\Lesson;
use App\Models\User;
use App\Services\Catalog\LessonPublishing;

/**
 * Uj lecke a modul vegere. Publikaltkent csak akkor jon letre, ha van jegyzete
 * vagy letezo videoja (feladata ekkor meg nem lehet).
 */
final readonly class CreateLesson
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
    public function handle(array $attributes, User $admin): Lesson
    {
        $lesson = new Lesson($attributes);
        $this->publishing->assertPublishable($lesson);

        return $this->catalog->create($lesson, self::PARENT, $admin);
    }
}
