<?php

declare(strict_types=1);

namespace App\Enums;

enum RegistrationMode: string
{
    case Open = 'open';
    case Invite = 'invite';
}
