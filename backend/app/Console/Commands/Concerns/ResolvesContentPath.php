<?php

declare(strict_types=1);

namespace App\Console\Commands\Concerns;

/**
 * A `catalog:import` és `catalog:export` közös paraméter-feldolgozása: a `--path` (a repó gyökeréhez
 * képest vagy abszolút) és az `--only` útvonal-előtag.
 */
trait ResolvesContentPath
{
    private function resolveRoot(): string
    {
        $path = (string) $this->option('path');
        if (preg_match('#^([A-Za-z]:[\\\\/]|[\\\\/])#', $path) === 1) {
            return $path;
        }

        return base_path('..').'/'.$path;
    }

    /**
     * @return list<string>
     */
    private function only(): array
    {
        $only = trim((string) $this->option('only'), '/');

        return $only === '' ? [] : explode('/', $only);
    }
}
