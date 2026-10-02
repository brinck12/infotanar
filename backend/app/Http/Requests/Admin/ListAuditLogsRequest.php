<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Enums\AuditAction;
use App\Services\Admin\Audit\AuditLogFilters;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * A naplo szurofeltetelei (#161). A `from`/`to` idopont (ISO 8601, idozona-eltolassal): a
 * kliens a sajat helyi napjahatarat kuldi, igy a backendnek nem kell idozonat tudnia.
 */
final class ListAuditLogsRequest extends FormRequest
{
    private const DEFAULT_PER_PAGE = 25;

    private const MAX_PER_PAGE = 100;

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'action' => ['sometimes', 'string', Rule::in(array_column(AuditAction::cases(), 'value'))],
            'actor_id' => ['sometimes', 'integer', 'min:1'],
            // A morph-alias (nem az osztalynev): csak ismert tipus szurheto.
            // A tipus es az azonosito csak egyutt ertelmes (nem `sometimes`: az kihagyna a required_with-et).
            'subject_type' => ['required_with:subject_id', 'string', Rule::in(array_keys(Relation::morphMap()))],
            'subject_id' => ['required_with:subject_type', 'integer', 'min:1'],
            'from' => ['sometimes', 'date'],
            'to' => ['sometimes', 'date', 'after:from'],
            'per_page' => ['sometimes', 'integer', 'between:1,'.self::MAX_PER_PAGE],
            'cursor' => ['sometimes', 'string'],
        ];
    }

    public function filters(): AuditLogFilters
    {
        return new AuditLogFilters(
            action: AuditAction::tryFrom($this->string('action')->toString()),
            actorId: $this->filled('actor_id') ? $this->integer('actor_id') : null,
            subjectType: $this->filled('subject_type') ? $this->string('subject_type')->toString() : null,
            subjectId: $this->filled('subject_id') ? $this->integer('subject_id') : null,
            from: $this->filled('from') ? CarbonImmutable::parse($this->string('from')->toString()) : null,
            to: $this->filled('to') ? CarbonImmutable::parse($this->string('to')->toString()) : null,
        );
    }

    public function perPage(): int
    {
        return $this->integer('per_page', self::DEFAULT_PER_PAGE);
    }
}
