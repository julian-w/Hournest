<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Enums\LedgerEntryType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreVacationLedgerEntryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    public function rules(): array
    {
        return [
            'type' => [
                'required',
                Rule::in([
                    LedgerEntryType::Bonus->value,
                    LedgerEntryType::Adjustment->value,
                    LedgerEntryType::Carryover->value,
                    LedgerEntryType::Expired->value,
                ]),
            ],
            'days' => ['required', 'numeric'],
            'comment' => ['required', 'string', 'max:500'],
            'year' => ['sometimes', 'integer', 'min:2000', 'max:2100'],
        ];
    }
}
