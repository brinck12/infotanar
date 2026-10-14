<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Spreadsheet\Checks;

use App\Enums\RubricCheckType;
use App\Services\FileTasks\CheckOutcome;
use App\Services\FileTasks\Grammar\Colors;
use App\Services\FileTasks\Grammar\Numbers;
use App\Services\FileTasks\Grammar\Text;
use App\Services\FileTasks\Spreadsheet\ConditionalFormat;
use App\Services\FileTasks\Spreadsheet\SpreadsheetModel;

/**
 * Felteteles formazas a tartomanyon. Az elvart ertek vesszovel elvalasztott
 * feltetelek (ES): `rule:greater_than 50` (szabalyfajta es kuszobertekek,
 * szokozzel elvalasztva), `fill:#FF0000` (kitoltes), `any` (van felteteles
 * formazas). A szabaly akkor felel meg, ha a tartomany egeszet lefedi.
 */
final class ConditionalFormatCheck extends SpreadsheetCheck
{
    public function type(): RubricCheckType
    {
        return RubricCheckType::ConditionalFormat;
    }

    public function validate(string $property, string $expected): ?string
    {
        if (($error = $this->addressError($property)) !== null) {
            return $error;
        }

        $terms = $this->terms($expected);

        if ($terms === []) {
            return self::message('filetasks.sheet_expected_required');
        }

        foreach ($terms as $term) {
            $error = $this->termError($term);

            if ($error !== null) {
                return $error;
            }
        }

        return null;
    }

    protected function check(SpreadsheetModel $model, string $property, string $expected): CheckOutcome
    {
        $located = $this->locate($model, $property);

        if ($located === null) {
            return CheckOutcome::fail();
        }

        [$sheet, $range] = $located;
        $terms = $this->terms($expected);
        $found = null;

        foreach ($sheet->conditionalFormats as $format) {
            if (! $format->covers($range)) {
                continue;
            }

            $found ??= $this->describe($format);

            foreach ($terms as $term) {
                if (! $this->satisfies($format, $term)) {
                    continue 2;
                }
            }

            return CheckOutcome::pass($this->describe($format));
        }

        return CheckOutcome::fail($found);
    }

    /** @return list<string> */
    private function terms(string $expected): array
    {
        return array_values(array_filter(array_map(trim(...), explode(',', $expected)), static fn (string $term): bool => $term !== ''));
    }

    private function termError(string $term): ?string
    {
        if (mb_strtolower($term, 'UTF-8') === 'any') {
            return null;
        }

        if (preg_match('/^fill\s*:\s*(.+)$/iu', $term, $match) === 1) {
            return Colors::parse($match[1]) === null ? self::message('filetasks.cf_fill_invalid') : null;
        }

        if (preg_match('/^rule\s*:\s*([a-z_]+)((?:\s+\S+)*)\s*$/iu', $term, $match) !== 1) {
            return self::message('filetasks.cf_term_invalid', ['term' => $term]);
        }

        $rule = strtolower($match[1]);

        if (! isset(ConditionalFormat::ARGUMENTS[$rule])) {
            return self::message('filetasks.cf_rule_invalid', ['list' => implode(', ', array_keys(ConditionalFormat::ARGUMENTS))]);
        }

        $arguments = preg_split('/\s+/', trim($match[2]), -1, PREG_SPLIT_NO_EMPTY) ?: [];

        return count($arguments) === ConditionalFormat::ARGUMENTS[$rule] ? null : self::message('filetasks.cf_arguments_invalid', ['rule' => $rule, 'count' => ConditionalFormat::ARGUMENTS[$rule]]);
    }

    private function satisfies(ConditionalFormat $format, string $term): bool
    {
        if (mb_strtolower($term, 'UTF-8') === 'any') {
            return true;
        }

        if (preg_match('/^fill\s*:\s*(.+)$/iu', $term, $match) === 1) {
            $wanted = Colors::parse($match[1]);

            return $wanted !== null && $format->fill !== null && Colors::close($format->fill, $wanted);
        }

        if (preg_match('/^rule\s*:\s*([a-z_]+)((?:\s+\S+)*)\s*$/iu', $term, $match) !== 1 || strtolower($match[1]) !== $format->rule) {
            return false;
        }

        $arguments = preg_split('/\s+/', trim($match[2]), -1, PREG_SPLIT_NO_EMPTY) ?: [];

        if (count($arguments) !== count($format->arguments)) {
            return false;
        }

        foreach ($arguments as $index => $argument) {
            if (! $this->sameArgument($format->arguments[$index] ?? '', $argument)) {
                return false;
            }
        }

        return true;
    }

    private function sameArgument(string $found, string $expected): bool
    {
        $left = Numbers::parse($found);
        $right = Numbers::parse($expected);

        return $left !== null && $right !== null ? Numbers::close($left, $right) : Text::equals($found, $expected);
    }

    private function describe(ConditionalFormat $format): string
    {
        $text = self::message('filetasks.cf_rule_'.$format->rule);
        $arguments = implode(' és ', $format->arguments);

        return trim($text.' '.$arguments).($format->fill === null ? '' : ', '.self::message('filetasks.cf_fill').' '.Colors::format($format->fill));
    }
}
