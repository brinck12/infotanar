<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Services\Auth\Social\GoogleClient;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/** Kikapcsolt (vagy kulcs nelkuli) Google-belepesnel a vegpontok nem leteznek. */
final readonly class EnsureGoogleLoginEnabled
{
    public function __construct(private GoogleClient $google) {}

    public function handle(Request $request, Closure $next): Response
    {
        if (! $this->google->isEnabled()) {
            throw new NotFoundHttpException;
        }

        /** @var Response */
        return $next($request);
    }
}
