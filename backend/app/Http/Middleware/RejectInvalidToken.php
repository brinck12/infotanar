<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Bejelentkezes nelkul is hivhato vegpontokra (#136): token nelkul a keres
 * vendegkent megy tovabb, de ha a kliens tokent kuld es az mar nem ervenyes
 * (lejart, visszavontak), 401-et kap.
 *
 * Enelkul a lejart tokenu felhasznalot csendben vendegkent kezelnenk: a
 * beadasa nem kotodne hozza, a haladasa elveszne, mikozben a feluleten ugy
 * latja, be van jelentkezve.
 */
final class RejectInvalidToken
{
    /**
     * @param  Closure(Request): Response  $next
     *
     * @throws AuthenticationException
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->bearerToken() !== null && $request->user('sanctum') === null) {
            throw new AuthenticationException;
        }

        return $next($request);
    }
}
