<?php

declare(strict_types=1);

namespace App\Exceptions\Exams;

use App\Exceptions\DomainException;

/** A vizsga nem tehetö közzé: hiányzik valami, amit a diák a vizsgán igényelne. */
final class ExamNotPublishable extends DomainException
{
    public static function noParts(): self
    {
        return new self(__('exams.publish.no_parts'));
    }

    public static function rubricIncomplete(int $number): self
    {
        return new self(__('exams.publish.rubric_incomplete', ['number' => $number]));
    }

    public static function exerciseUnpublished(int $number): self
    {
        return new self(__('exams.publish.exercise_unpublished', ['number' => $number]));
    }

    public static function pointsMismatch(int $sum, int $total): self
    {
        return new self(__('exams.publish.points_mismatch', ['sum' => $sum, 'total' => $total]));
    }

    public function status(): int
    {
        return 422;
    }

    public function errors(): array
    {
        return ['is_published' => [$this->getMessage()]];
    }
}
