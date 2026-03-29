<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    public function rules(): array
    {
        return [
            'role' => ['sometimes', Rule::in([UserRole::Employee->value, UserRole::Admin->value, UserRole::Superadmin->value])],
            'vacation_days_per_year' => ['sometimes', 'integer', 'min:0', 'max:365'],
            'holidays_exempt' => ['sometimes', 'boolean'],
            'weekend_worker' => ['sometimes', 'boolean'],
        ];
    }
}
