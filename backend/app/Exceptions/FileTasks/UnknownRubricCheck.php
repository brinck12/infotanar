<?php

declare(strict_types=1);

namespace App\Exceptions\FileTasks;

use App\Exceptions\DomainException;

/**
 * Az ertekelolap egy automatikus pontja nem mentheto, mert a tipus kezeloje
 * nem tudja vegrehajtani a megadott `property` / `expected` part. Az uzenet a
 * kezelo magyar hibaszovege (CheckHandler::validate), es az admin urlap
 * `property` mezoje ala kerul.
 */
final class UnknownRubricCheck extends DomainException
{
    public function __construct(string $reason)
    {
        parent::__construct($reason);
    }

    public function status(): int
    {
        return 422;
    }

    public function errors(): array
    {
        return ['property' => [$this->getMessage()]];
    }
}
