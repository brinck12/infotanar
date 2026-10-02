<?php

declare(strict_types=1);

namespace App\Services\Admin\Metrics;

use Carbon\CarbonImmutable;

/**
 * Egymast koveto helyi (pl. budapesti) naptari napok egy idoszakon belul (#160).
 *
 * Az adatbazis UTC-ben tarol, a napi bontas helyi napok szerint kell. A MySQL idozona-tablait
 * nem feltetelezhetjuk, ezert a konverziot a PHP vegzi: a napokat az azonos UTC-eltolasu
 * szakaszokra (`segments`) osztjuk, es a lekerdezes szakaszonkent fix eltolassal csoportosit
 * (lasd SqlDialect). Egy szakasz mindig helyi ejfelkor kezdodik es er veget, igy egy nap
 * sosem esik ket szakaszra. Az eltolast a nap delben ervenyes ertekebol vesszuk: az
 * oraallitas napjan az ejfel koruli egy ora a szomszedos napra kerulhet.
 */
final readonly class LocalDayRange
{
    /**
     * @param  list<string>  $days  Helyi napok (`Y-m-d`), novekvo sorrendben.
     * @param  list<array{from: CarbonImmutable, to: CarbonImmutable, offset: int}>  $segments  UTC hatarok [from, to) es az eltolas masodpercben.
     */
    private function __construct(
        public array $days,
        public array $segments,
        public CarbonImmutable $from,
        public CarbonImmutable $to,
    ) {}

    /** Az utolso `$days` helyi nap, a mai napot is beleertve. */
    public static function lastDays(CarbonImmutable $now, int $days, string $timezone): self
    {
        $today = $now->setTimezone($timezone)->startOfDay();

        return self::build($today->subDays($days - 1), $days, $timezone);
    }

    /** Az elozo, ugyanilyen hosszu idoszak (az osszehasonlitashoz). */
    public function previous(string $timezone): self
    {
        $length = count($this->days);
        $first = CarbonImmutable::parse($this->days[0], $timezone)->startOfDay();

        return self::build($first->subDays($length), $length, $timezone);
    }

    private static function build(CarbonImmutable $firstLocalMidnight, int $length, string $timezone): self
    {
        $days = [];
        /** @var list<array{from: CarbonImmutable, to: CarbonImmutable, offset: int}> $segments */
        $segments = [];

        for ($index = 0; $index < $length; $index++) {
            $midnight = $firstLocalMidnight->addDays($index)->startOfDay();
            $days[] = $midnight->format('Y-m-d');
            $offset = $midnight->setTime(12, 0)->utcOffset() * 60;
            $from = $midnight->setTimezone('UTC');
            $to = $midnight->addDay()->startOfDay()->setTimezone('UTC');

            $last = array_key_last($segments);
            if ($last !== null && $segments[$last]['offset'] === $offset) {
                $segments[$last]['to'] = $to;
            } else {
                $segments[] = ['from' => $from, 'to' => $to, 'offset' => $offset];
            }
        }

        return new self(
            $days,
            $segments,
            $firstLocalMidnight->startOfDay()->setTimezone('UTC'),
            $firstLocalMidnight->addDays($length)->startOfDay()->setTimezone('UTC'),
        );
    }
}
