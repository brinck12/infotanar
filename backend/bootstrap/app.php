<?php

declare(strict_types=1);

use App\Exceptions\DomainException;
use App\Exceptions\Judge0Exception;
use App\Http\Middleware\EnsureUserIsAdmin;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Exceptions\ThrottleRequestsException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Exceptions\InvalidSignatureException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias(['admin' => EnsureUserIsAdmin::class]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Az API mindig JSON-t ad, akkor is, ha a kliens nem kuld Accept fejlecet.
        $exceptions->shouldRenderJsonWhen(static fn (Request $request): bool => $request->is('api/*'));

        // Elore lathato uzleti hibak: nem kerulnek a hibanaploba.
        $exceptions->dontReport([DomainException::class]);

        $isApi = static fn (Request $request): bool => $request->is('api/*');
        $message = static fn (string $key, int $status): JsonResponse => response()->json(['message' => __($key)], $status);

        // A kodfuttato hibaja ne 500-as stacktrace legyen, hanem ertheto
        // magyar uzenet a futtatasi valasz alakjaban.
        $exceptions->render(static fn (Judge0Exception $e, Request $request) => $isApi($request)
            ? response()->json(['status' => 'error', 'message' => $e->getMessage(), 'results' => []], 503)
            : null);

        $exceptions->render(static fn (AuthenticationException $e, Request $request) => $isApi($request)
            ? $message('http.unauthenticated', 401)
            : null);

        $exceptions->render(static fn (AuthorizationException|AccessDeniedHttpException $e, Request $request) => $isApi($request)
            ? $message('http.forbidden', 403)
            : null);

        $exceptions->render(static fn (InvalidSignatureException $e, Request $request) => $isApi($request)
            ? $message('http.invalid_signature', 403)
            : null);

        $exceptions->render(static fn (NotFoundHttpException $e, Request $request) => $isApi($request)
            ? $message('http.not_found', 404)
            : null);

        $exceptions->render(static fn (ThrottleRequestsException $e, Request $request) => $isApi($request)
            ? $message('http.too_many_requests', 429)->withHeaders($e->getHeaders())
            : null);
    })->create();
