<?php

declare(strict_types=1);

namespace App\Enums;

enum Role: string
{
    case Student = 'student';
    case Admin = 'admin';
}
