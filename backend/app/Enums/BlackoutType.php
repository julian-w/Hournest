<?php

declare(strict_types=1);

namespace App\Enums;

enum BlackoutType: string
{
    case Freeze = 'freeze';
    case CompanyHoliday = 'company_holiday';
}
