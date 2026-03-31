<?php

declare(strict_types=1);

namespace App\Enums;

enum AbsenceScope: string
{
    case FullDay = 'full_day';
    case Morning = 'morning';
    case Afternoon = 'afternoon';
}
