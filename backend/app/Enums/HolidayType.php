<?php

declare(strict_types=1);

namespace App\Enums;

enum HolidayType: string
{
    case Fixed = 'fixed';
    case Variable = 'variable';
}
