<?php

declare(strict_types=1);

namespace App\Services\FileTasks;

use App\Enums\FileSubmissionStatus;
use App\Models\FileSubmission;
use Carbon\CarbonImmutable;

/**
 * Egy fajl ertekelesenek kimenete: vagy sikerult (pillanatkeppel), vagy a
 * fajl nem volt feldolgozhato (magyar okkal). A FileEvaluator adja; a hivo az
 * applyTo() metodussal irja ra a beadas sorara.
 */
final readonly class FileEvaluation
{
    private function __construct(
        public FileSubmissionStatus $status,
        public ResultSnapshot $result,
        /** A diaknak megjelenitheto ok, ha a fajl nem volt feldolgozhato; kulonben null. */
        public ?string $error,
    ) {}

    public static function evaluated(ResultSnapshot $result): self
    {
        return new self(FileSubmissionStatus::Evaluated, $result, null);
    }

    public static function failed(string $error): self
    {
        return new self(FileSubmissionStatus::Failed, new ResultSnapshot([]), $error);
    }

    public function isEvaluated(): bool
    {
        return $this->status === FileSubmissionStatus::Evaluated;
    }

    public function score(): int
    {
        return $this->result->score();
    }

    public function maxScore(): int
    {
        return $this->result->maxScore();
    }

    public function passed(): bool
    {
        return $this->isEvaluated() && $this->result->passed();
    }

    /**
     * Rairja az eredmenyt a beadas sorara (menteni a hivo ment). Sikertelen
     * feldolgozasnal a sor `failed`, pillanatkep nelkul, a magyar okkal.
     */
    public function applyTo(FileSubmission $submission): void
    {
        $submission->status = $this->status;
        $submission->result = $this->isEvaluated() ? $this->result->toArray() : null;
        $submission->score = $this->score();
        $submission->max_score = $this->maxScore();
        $submission->passed = $this->passed();
        $submission->error = $this->error === null ? null : mb_substr($this->error, 0, 500);
        $submission->evaluated_at = CarbonImmutable::now();
    }
}
