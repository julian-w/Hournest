<?php

declare(strict_types=1);

namespace App\Enums;

enum LedgerEntryType: string
{
    case Entitlement = 'entitlement';
    case Carryover = 'carryover';
    case Bonus = 'bonus';
    case Taken = 'taken';
    case Expired = 'expired';
    case Adjustment = 'adjustment';
}
