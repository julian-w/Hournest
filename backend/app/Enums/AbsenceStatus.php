<?php

declare(strict_types=1);

namespace App\Enums;

enum AbsenceStatus: string
{
    case Reported = 'reported';
    case Acknowledged = 'acknowledged';
    case Pending = 'pending';
    case Approved = 'approved';
    case Rejected = 'rejected';
    case AdminCreated = 'admin_created';
}
