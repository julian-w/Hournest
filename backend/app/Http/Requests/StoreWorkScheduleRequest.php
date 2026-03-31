<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreWorkScheduleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    public function rules(): array
    {
        return [
            'start_date' => ['required', 'date'],
            'end_date' => ['nullable', 'date', 'after:start_date'],
            'work_days' => ['required', 'array', 'min:1'],
            'work_days.*' => ['integer', 'min:1', 'max:7'],
            'weekly_target_minutes' => ['sometimes', 'integer', 'min:0', 'max:6000'],
        ];
    }
}
