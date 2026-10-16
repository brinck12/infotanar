<?php

declare(strict_types=1);

namespace App\Services\Execution;

use App\Exceptions\Execution\ExecutionCapacityExhausted;
use Closure;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Config;

/**
 * Parhuzamossagi korlat a kodkiertekelesre: N "slot", mindegyik egy Cache::lock.
 *
 * A percenkenti limitek (ExecutionRateLimit) kereseket szamolnak, nem azt, hany
 * kiertekeles fut egyszerre. Egy kiertekeles egy php-fpm workert tart, akar a
 * teljes hatarideig; kapacitas nelkul egy osztalynyi diak kimerithetne a poolt.
 * Ha nincs szabad slot, nem allunk sorba: azonnali 503 megy ki.
 *
 * A slot elettartama (`judge0.concurrency_slot_ttl`) kicsit hosszabb a
 * kiertekelesi hataridonal, igy egy elhalt folyamat foglalasa magatol lejar.
 * A lock-ok a cache-ben elnek: tobb szerveren kozos cache (Redis, OPS-9) kell.
 */
final class ExecutionCapacity
{
    /**
     * @template T
     *
     * @param  Closure(): T  $callback
     * @return T
     *
     * @throws ExecutionCapacityExhausted
     */
    public function run(Closure $callback): mixed
    {
        $slots = Config::integer('judge0.max_concurrent_evaluations');

        if ($slots <= 0) {
            return $callback();
        }

        $ttl = max(1, Config::integer('judge0.concurrency_slot_ttl'));

        // Veletlen kezdopont: ne ugyanazt a slotot probalja mindenki elsonek.
        $start = random_int(0, $slots - 1);

        for ($i = 0; $i < $slots; $i++) {
            $lock = Cache::lock('judge0:slot:'.(($start + $i) % $slots), $ttl);

            if ($lock->get()) {
                try {
                    return $callback();
                } finally {
                    $lock->release();
                }
            }
        }

        throw new ExecutionCapacityExhausted;
    }
}
