<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    public function rules(): array
    {
        $passwordRule = config('auth.oauth_enabled')
            ? ['nullable', 'string', 'min:8', 'max:255']
            : ['required', 'string', 'min:8', 'max:255'];

        return [
            'display_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'role' => ['required', Rule::in([UserRole::Employee->value, UserRole::Admin->value])],
            'vacation_days_per_year' => ['sometimes', 'integer', 'min:0', 'max:365'],
            'password' => $passwordRule,
        ];
    }
}
