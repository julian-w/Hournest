<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Enums\AbsenceStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ReviewAbsenceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', Rule::in([
                AbsenceStatus::Acknowledged->value,
                AbsenceStatus::Approved->value,
                AbsenceStatus::Rejected->value,
            ])],
            'admin_comment' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
