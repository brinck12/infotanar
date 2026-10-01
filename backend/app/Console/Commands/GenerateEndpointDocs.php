<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Http\Middleware\EnsureUserIsAdmin;
use Illuminate\Console\Command;
use Illuminate\Routing\Route;
use Illuminate\Routing\Router;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

/**
 * A docs/api-endpoints.md eloallitasa a regisztralt utvonalakbol (#140), hogy
 * a vegpontlista ne avulhasson el. A CI a `--check` kapcsoloval ellenorzi,
 * hogy a fajl egyezik-e a koddal.
 */
class GenerateEndpointDocs extends Command
{
    private const PREFIX = 'api/v1';

    protected $signature = 'docs:endpoints {--check : Nem ír, csak ellenőrzi, hogy a fájl naprakész-e}';

    protected $description = 'A docs/api-endpoints.md előállítása az API útvonalaiból';

    public function handle(Router $router): int
    {
        $path = base_path('../docs/api-endpoints.md');
        $markdown = $this->render($router);

        if (! $this->option('check')) {
            File::put($path, $markdown);
            $this->info('Frissítve: docs/api-endpoints.md');

            return self::SUCCESS;
        }

        // A sorvegek a munkakonyvtarban elterhetnek (Windows), a tartalom szamit.
        $current = File::exists($path) ? str_replace("\r\n", "\n", File::get($path)) : '';

        if ($current !== $markdown) {
            $this->error('A docs/api-endpoints.md elavult. Futtasd: php artisan docs:endpoints');

            return self::FAILURE;
        }

        $this->info('A docs/api-endpoints.md naprakész.');

        return self::SUCCESS;
    }

    private function render(Router $router): string
    {
        $sections = collect($router->getRoutes()->getRoutes())
            ->filter(static fn (Route $route): bool => str_starts_with($route->uri(), self::PREFIX.'/'))
            ->sortBy(fn (Route $route): string => $route->uri().' '.$this->method($route))
            ->groupBy(fn (Route $route): string => $this->area($route))
            ->sortKeys()
            ->map(fn (Collection $routes, string $area): string => $this->section($area, $routes));

        return implode("\n", [
            '# API végpontok',
            '',
            '> Generált fájl, ne szerkeszd kézzel. Frissítés: `cd backend && php artisan docs:endpoints`.',
            '',
            'Minden végpont a `/'.self::PREFIX.'` előtag alatt érhető el. A hozzáférés oszlop jelentése:',
            '**nyilvános**: token nélkül is hívható (érvénytelen token 401-et kap);',
            '**bejelentkezve**: `Authorization: Bearer <token>` kell;',
            '**admin**: admin szerepkör kell;',
            '**aláírt link**: a levélben kiküldött, lejáró aláírás védi.',
            '',
            $sections->implode("\n"),
        ]);
    }

    /** @param Collection<int, Route> $routes */
    private function section(string $area, Collection $routes): string
    {
        $rows = $routes->map(fn (Route $route): string => sprintf(
            '| `%s` | `/%s` | %s | %s |',
            $this->method($route),
            Str::after($route->uri(), self::PREFIX.'/'),
            $this->access($route),
            $this->throttle($route),
        ));

        return implode("\n", ["## {$area}", '', '| Metódus | Útvonal | Hozzáférés | Limit |', '|---|---|---|---|', ...$rows, '']);
    }

    /** Az utvonal elso szakasza (pl. `billing`), ez a tablazatok csoportositasa. */
    private function area(Route $route): string
    {
        return Str::before(Str::after($route->uri(), self::PREFIX.'/'), '/');
    }

    private function method(Route $route): string
    {
        return collect($route->methods())->reject(static fn (string $method): bool => $method === 'HEAD')->implode('|');
    }

    private function access(Route $route): string
    {
        $middleware = collect($route->gatherMiddleware())->map(static fn (mixed $name): string => is_string($name) ? $name : '');

        return match (true) {
            $middleware->contains(static fn (string $name): bool => in_array($name, ['admin', EnsureUserIsAdmin::class], true)) => 'admin',
            $middleware->contains(static fn (string $name): bool => str_starts_with($name, 'auth:')) => 'bejelentkezve',
            $middleware->contains(static fn (string $name): bool => str_starts_with($name, 'signed')) => 'aláírt link',
            default => 'nyilvános',
        };
    }

    /** A sebessegkorlat neve (AppServiceProvider) vagy `kérés,perc` alakja; `–`, ha nincs. */
    private function throttle(Route $route): string
    {
        $throttle = collect($route->gatherMiddleware())
            ->first(static fn (mixed $name): bool => is_string($name) && str_starts_with($name, 'throttle:'));

        return is_string($throttle) ? '`'.Str::after($throttle, 'throttle:').'`' : '–';
    }
}
