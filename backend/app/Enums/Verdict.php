<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * A PRD szerinti kiertekelesi allapotok (tesztesetenkent es osszesitve).
 * A kliens a `value`-ra agazik el, a `label()` a magyar felirat.
 */
enum Verdict: string
{
    case Accepted = 'accepted';
    case WrongAnswer = 'wrong_answer';
    case TimeLimitExceeded = 'time_limit_exceeded';
    case CompilationError = 'compilation_error';
    case RuntimeError = 'runtime_error';
    /** A futtato kornyezet hibaja (elerhetetlen, belso hiba) - nem a megoldase. */
    case SystemError = 'system_error';

    /**
     * Judge0 status id-k: 3 Accepted (lefutott), 4 Wrong Answer, 5 TLE,
     * 6 Compilation Error, 7-12 Runtime Error (SIGSEGV, SIGXFSZ, SIGFPE,
     * SIGABRT, NZEC, Other), 13 Internal Error, 14 Exec Format Error.
     * Az elvart kimenetet mi vetjuk ossze, ezert sikeres futasnal a Judge0
     * "Accepted"-et ad, a Wrong Answert a mi osszevetesunk donti el.
     */
    public static function fromJudge0(int $statusId, bool $outputMatches): self
    {
        return match (true) {
            $statusId === 3 => $outputMatches ? self::Accepted : self::WrongAnswer,
            $statusId === 4 => self::WrongAnswer,
            $statusId === 5 => self::TimeLimitExceeded,
            $statusId === 6 => self::CompilationError,
            $statusId >= 7 && $statusId <= 12 => self::RuntimeError,
            default => self::SystemError,
        };
    }

    public function label(): string
    {
        return __("execution.verdicts.{$this->value}");
    }
}
