<?php

declare(strict_types=1);

namespace App\Enums;

enum AuditAction: string
{
    case AccountExported = 'account.exported';
    case AccountDeleted = 'account.deleted';
}
