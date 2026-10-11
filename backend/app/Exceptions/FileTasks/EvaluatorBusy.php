<?php

declare(strict_types=1);

namespace App\Exceptions\FileTasks;

use App\Exceptions\DomainException;

/**
 * Minden ertekelo hely foglalt (filetasks.max_concurrent_evaluations). A
 * keres nem all sorba a PHP-FPM workerei mogott: a diak azonnal megtudja,
 * hogy kicsit kesobb probalja ujra. A fajl ilyenkor nem tarolodik el.
 */
final class EvaluatorBusy extends DomainException
{
    public function __construct()
    {
        parent::__construct(__('filetasks.evaluator_busy'));
    }

    public function status(): int
    {
        return 503;
    }
}
