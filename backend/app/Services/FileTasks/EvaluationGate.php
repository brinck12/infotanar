<?php

declare(strict_types=1);

namespace App\Services\FileTasks;

use App\Exceptions\FileTasks\EvaluatorBusy;
use Closure;
use Illuminate\Contracts\Cache\Lock;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Config;

/**
 * Egyszerre legfeljebb `filetasks.max_concurrent_evaluations` fajlertekeles
 * futhat. Az ertekeles szinkron, a keresen belul tortenik: korlat nelkul nehany
 * nagy fajl lefoglalna az osszes PHP-FPM workert, es az egesz oldal allna.
 *
 * Szemafor cache-zarakbol: annyi nevesitett hely van, ahany ertekeles futhat.
 * Minden helyet egyszer probalunk meg, varakozas nelkul; ha egyik sem szabad,
 * a keres azonnal 503-at kap. A zar elettartama hosszabb az ertekeles
 * idokorlatjanal, igy egy osszeomlott folyamat helye magatol felszabadul.
 */
final class EvaluationGate
{
    private const LOCK_PREFIX = 'filetasks.eval.';

    /** A zar ennyivel el tovabb az ertekeles idokorlatjanal (tarolas, mentes, takaritas ideje). */
    private const LOCK_MARGIN_SECONDS = 15;

    /**
     * Lefuttatja a visszahivast egy szabad ertekelo helyen.
     *
     * @template T
     *
     * @param  Closure(): T  $callback
     * @return T
     *
     * @throws EvaluatorBusy ha minden hely foglalt
     */
    public function run(Closure $callback): mixed
    {
        $lock = $this->acquire();

        try {
            return $callback();
        } finally {
            $lock->release();
        }
    }

    /** @throws EvaluatorBusy */
    private function acquire(): Lock
    {
        $slots = max(1, Config::integer('filetasks.max_concurrent_evaluations'));
        $seconds = Config::integer('filetasks.evaluation_timeout') + self::LOCK_MARGIN_SECONDS;

        for ($slot = 0; $slot < $slots; $slot++) {
            $lock = Cache::lock(self::LOCK_PREFIX.$slot, $seconds);

            if ($lock->get()) {
                return $lock;
            }
        }

        throw new EvaluatorBusy;
    }
}
