<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\ClientErrorRequest;
use App\Models\User;
use App\Support\Alerts\ClientErrorSanitizer;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;

/**
 * A frontend nem kezelt hibai (#131, ADR 0003): enelkul egy diak gepen
 * osszeomlo oldalrol sosem ertesulnenk. Kulon naplofajlba kerulnek. A
 * felhasznalot a token alapjan azonositjuk, nem a kliens allitasa alapjan.
 * Az URL-bol a lekerdezes es a toredek lemarad (tokenek, e-mail-cimek lehetnek
 * benne), a szovegek hossza korlatos (lasd ClientErrorSanitizer).
 */
final class ClientErrorController extends Controller
{
    public function __invoke(ClientErrorRequest $request): Response
    {
        $user = $request->user('sanctum');

        Log::channel('client')->error(ClientErrorSanitizer::message($request->string('message')->toString()), [
            'url' => ClientErrorSanitizer::url($request->string('url')->toString()),
            'release' => $request->input('release'),
            'user_id' => $user instanceof User ? $user->id : null,
            'user_agent' => $request->userAgent(),
            'stack' => ClientErrorSanitizer::stack($request->input('stack')),
            'component_stack' => ClientErrorSanitizer::stack($request->input('component_stack')),
        ]);

        return response()->noContent();
    }
}
