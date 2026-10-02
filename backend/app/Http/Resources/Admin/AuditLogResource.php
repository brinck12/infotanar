<?php

declare(strict_types=1);

namespace App\Http\Resources\Admin;

use App\Models\AuditLog;
use App\Services\Admin\Audit\AuditSubject;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Egy naplobejegyzes (#161). A szereplo es a targy akkor is ertelmesen jelenik meg, ha azota
 * torolték: a szereplo "torolt felhasznalo", a targy a naplo pillanatkepebol kap feliratot.
 *
 * @mixin AuditLog
 */
final class AuditLogResource extends JsonResource
{
    public function __construct(AuditLog $log, private readonly ?AuditSubject $subject = null)
    {
        parent::__construct($log);
    }

    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'action' => ['value' => $this->action->value, 'label' => $this->action->label()],
            'actor' => $this->actor(),
            'subject' => $this->subject === null ? null : [
                'type' => $this->subject->type,
                'type_label' => __("admin.audit.subjects.{$this->subject->type}"),
                'id' => $this->subject->id,
                'label' => $this->subject->label,
                'admin_path' => $this->subject->adminPath,
                'exists' => $this->subject->exists,
            ],
            'metadata' => $this->metadata,
            'ip_address' => $this->ip_address,
            'created_at' => $this->created_at->toIso8601String(),
        ];
    }

    /** @return array{id: int|null, name: string, email: string|null, deleted: bool} */
    private function actor(): array
    {
        $actor = $this->actor;

        // Nincs szereplo: a rendszer (pl. egy utemezett feladat) tette.
        if ($actor === null) {
            return ['id' => null, 'name' => __('admin.audit.system_actor'), 'email' => null, 'deleted' => false];
        }

        return $actor->trashed()
            ? ['id' => $actor->id, 'name' => __('admin.audit.deleted_actor'), 'email' => null, 'deleted' => true]
            : ['id' => $actor->id, 'name' => $actor->name, 'email' => $actor->email, 'deleted' => false];
    }
}
