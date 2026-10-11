<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Learning;

use App\Actions\Learning\RecordOralAttempt;
use App\Actions\Learning\SaveOralPractice;
use App\Http\Controllers\Controller;
use App\Http\Requests\Learning\UpdateOralPracticeRequest;
use App\Http\Resources\Learning\OralPracticeResource;
use App\Models\User;
use Illuminate\Container\Attributes\CurrentUser;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * A bejelentkezett felhasznalo szobeli gyakorlasi allapota, temakoronkent.
 *
 * A `{topic}` csak ismert temakor lehet: ezt az utvonal megkotese biztositja
 * (routes/api/learning.php), ismeretlen slugra a keres ide el sem jut (404).
 *
 * A ket iro vegpont akkor is 200-zal valaszol, ha a sort most hozta letre: a
 * kliens szemeben minden temakornak van allapota, legfeljebb ures.
 */
final class OralPracticeController extends Controller
{
    /** Csak a mar letezo sorok; a tobbi temakor allapota a frontend ures alaperteke. */
    public function index(#[CurrentUser] User $user): AnonymousResourceCollection
    {
        return OralPracticeResource::collection($user->oralPractices()->orderBy('id')->get());
    }

    public function update(UpdateOralPracticeRequest $request, #[CurrentUser] User $user, string $topic, SaveOralPractice $save): JsonResponse
    {
        $practice = $save->handle($user, $topic, $request->checked(), $request->notes(), $request->scores());

        return OralPracticeResource::make($practice)->response()->setStatusCode(JsonResponse::HTTP_OK);
    }

    public function recordAttempt(#[CurrentUser] User $user, string $topic, RecordOralAttempt $record): JsonResponse
    {
        return OralPracticeResource::make($record->handle($user, $topic))->response()->setStatusCode(JsonResponse::HTTP_OK);
    }
}
