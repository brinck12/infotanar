<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Catalog;

use App\Actions\Catalog\BuildLessonPage;
use App\Http\Controllers\Controller;
use App\Http\Resources\Catalog\LessonResource;
use App\Models\User;
use Illuminate\Http\Request;

/** Egy lecke oldala: tananyag, video-jelzo, feladatok. Vendegkent is hivhato. */
final class LessonController extends Controller
{
    public function show(Request $request, string $trackSlug, string $lessonSlug, BuildLessonPage $buildPage): LessonResource
    {
        $user = $request->user('sanctum');

        return LessonResource::make($buildPage->handle($user instanceof User ? $user : null, $trackSlug, $lessonSlug));
    }
}
