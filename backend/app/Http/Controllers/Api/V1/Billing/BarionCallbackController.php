<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Billing;

use App\Http\Controllers\Controller;
use Illuminate\Http\Response;

/**
 * A Barion ide jelez (CallbackUrl), ha egy fizetes allapota valtozik. A
 * feldolgozas a #15-ben keszul; addig csak nyugtazzuk a hivast, hogy a
 * Barion ne probalkozzon ujra.
 */
final class BarionCallbackController extends Controller
{
    public function __invoke(): Response
    {
        return response()->noContent(Response::HTTP_OK);
    }
}
