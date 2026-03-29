<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Enums\VacationStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ReviewVacationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', Rule::in([VacationStatus::Approved->value, VacationStatus::Rejected->value])],
            'comment' => ['nullable', 'string', 'max:500'],
        ];
    }
}
