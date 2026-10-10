<?php

declare(strict_types=1);

namespace App\Services\FileTasks;

use App\Enums\RubricCheckType;
use Illuminate\Contracts\Container\Container;
use Illuminate\Support\Facades\Config;
use LogicException;

/**
 * Az olvasok es a vizsgalat-kezelok jegyzeke a config/filetasks.php `readers`
 * es `checks` listajabol. Singleton (AppServiceProvider), a peldanyokat az
 * elso hasznalatkor hozza letre a kontenerbol.
 *
 * A konfiguracio olyan osztalyokat is megnevez, amelyeket kesobbi csomagok
 * hoznak letre: ami meg nem letezik, azt kihagyja, igy az alkalmazas addig is
 * elindul, a hianyzo csaladnak pedig egyszeruen nincs kezeloje.
 */
final class CheckRegistry
{
    /** @var array<string, FileReader>|null kiterjesztes => olvaso */
    private ?array $readers = null;

    /** @var array<string, list<CheckHandler>>|null tipus erteke => kezelok, konfiguracios sorrendben */
    private ?array $handlers = null;

    public function __construct(private readonly Container $container) {}

    /**
     * A kiterjeszteshez (ponttal, pl. ".xlsx") tartozo olvaso; null, ha nincs.
     */
    public function readerFor(string $extension): ?FileReader
    {
        return $this->readers()[mb_strtolower($extension)] ?? null;
    }

    /**
     * Azok a kiterjesztesek, amelyekhez van olvaso.
     *
     * @return list<string>
     */
    public function readableExtensions(): array
    {
        return array_keys($this->readers());
    }

    /**
     * A tipus osszes kezeloje, konfiguracios sorrendben; ures, ha nincs.
     *
     * @return list<CheckHandler>
     */
    public function handlersFor(RubricCheckType $type): array
    {
        return $this->handlers()[$type->value] ?? [];
    }

    /**
     * Az a kezelo, amelyik a tipust ezen a megnyitott fajlon ki tudja
     * ertekelni; null, ha nincs ilyen (a pont akkor "bad").
     */
    public function handlerFor(RubricCheckType $type, OpenedFile $file): ?CheckHandler
    {
        foreach ($this->handlersFor($type) as $handler) {
            if ($handler->supports($file)) {
                return $handler;
            }
        }

        return null;
    }

    /**
     * Azok a tipusok, amelyekhez legalabb egy kezelo letezik (a `manual` nincs koztuk).
     *
     * @return list<RubricCheckType>
     */
    public function automatedTypes(): array
    {
        return array_values(array_filter(
            RubricCheckType::cases(),
            fn (RubricCheckType $type): bool => $this->handlersFor($type) !== [],
        ));
    }

    /** @return array<string, FileReader> */
    private function readers(): array
    {
        if ($this->readers !== null) {
            return $this->readers;
        }

        $readers = [];

        foreach ($this->instances('filetasks.readers', FileReader::class) as $reader) {
            foreach ($reader->extensions() as $extension) {
                $extension = mb_strtolower($extension);

                if (isset($readers[$extension])) {
                    throw new LogicException("A(z) {$extension} kiterjeszteshez tobb olvaso tartozik (config/filetasks.php).");
                }

                $readers[$extension] = $reader;
            }
        }

        return $this->readers = $readers;
    }

    /** @return array<string, list<CheckHandler>> */
    private function handlers(): array
    {
        if ($this->handlers !== null) {
            return $this->handlers;
        }

        $handlers = [];

        foreach ($this->instances('filetasks.checks', CheckHandler::class) as $handler) {
            $handlers[$handler->type()->value][] = $handler;
        }

        return $this->handlers = $handlers;
    }

    /**
     * A konfiguracioban megnevezett, mar letezo osztalyok peldanyai.
     *
     * @template T of object
     *
     * @param  class-string<T>  $contract
     * @return list<T>
     */
    private function instances(string $configKey, string $contract): array
    {
        $instances = [];

        foreach (Config::array($configKey) as $class) {
            if (! is_string($class) || ! class_exists($class)) {
                continue;
            }

            $instance = $this->container->make($class);

            if (! $instance instanceof $contract) {
                throw new LogicException("A(z) {$class} nem valositja meg ezt: {$contract} (config/{$configKey}).");
            }

            $instances[] = $instance;
        }

        return $instances;
    }
}
