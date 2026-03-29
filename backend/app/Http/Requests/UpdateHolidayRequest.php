<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Enums\HolidayType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateHolidayRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'date' => ['sometimes', 'date'],
            'type' => ['sometimes', Rule::in([HolidayType::Fixed->value, HolidayType::Variable->value])],
        ];
    }
}
