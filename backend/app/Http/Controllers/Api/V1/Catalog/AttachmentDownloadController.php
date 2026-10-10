<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Catalog;

use App\Enums\AttachmentRole;
use App\Http\Controllers\Controller;
use App\Models\Attachment;
use App\Services\Files\AttachmentUrls;
use App\Services\Files\PrivateFileStore;
use Illuminate\Contracts\Filesystem\FileNotFoundException;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * Csatolt fajl letoltese alairt, lejaro URL-en at (AttachmentUrls). Token
 * nem kell hozza: az <img src> es az <a download> nem tud fejlecet kuldeni,
 * a jogosultsagot az alairas hordozza (`signed:relative`).
 *
 * A diaknak tiltott szerepeket (`input`, `sample_solution`) csak az admin
 * eroforrasokban kiadott URL toltheti le; diak-URL-lel 404, mintha a fajl
 * nem is letezne. A rejtett tesztesetek bemenete igy nem szivaroghat ki.
 */
final class AttachmentDownloadController extends Controller
{
    public function __invoke(Request $request, int $attachment, AttachmentUrls $urls, PrivateFileStore $files): Response
    {
        $model = Attachment::query()->findOrFail($attachment);

        if ($model->role->isAdminOnly() && ! $urls->grantsAdminAccess($request)) {
            throw new NotFoundHttpException;
        }

        try {
            // Beagyazva csak a mintakep jelenhet meg (<img>); minden mas letoltes.
            return $files->response($model->storedFile(), inline: $model->role === AttachmentRole::SampleImage);
        } catch (FileNotFoundException) {
            throw new NotFoundHttpException;
        }
    }
}
