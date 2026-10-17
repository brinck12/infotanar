<?php

declare(strict_types=1);

namespace App\Services\Catalog\Content;

/** Egy tartalmi fájl hibája: melyik fájlban (a gyökérhez képest) és mi. */
final readonly class ContentProblem
{
    public function __construct(
        public string $file,
        public string $message,
    ) {}

    /**
     * @param  array<string, string|int>  $replace
     */
    public static function of(string $file, string $key, array $replace = []): self
    {
        return new self($file, (string) __('catalog_import.'.$key, $replace));
    }

    public function line(): string
    {
        return $this->file.': '.$this->message;
    }
}
