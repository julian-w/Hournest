<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Enums\VacationScope;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreVacationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'start_date' => ['required', 'date', 'after_or_equal:today'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'scope' => ['nullable', Rule::in(array_column(VacationScope::cases(), 'value'))],
            'comment' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $scope = $this->input('scope', VacationScope::FullDay->value);
            $startDate = $this->input('start_date');
            $endDate = $this->input('end_date');

            if (
                $scope !== VacationScope::FullDay->value
                && $startDate !== null
                && $endDate !== null
                && $startDate !== $endDate
            ) {
                $validator->errors()->add('scope', 'Half-day vacation must start and end on the same day.');
            }
        });
    }
}
