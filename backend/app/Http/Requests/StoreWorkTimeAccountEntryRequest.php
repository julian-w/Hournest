<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreWorkTimeAccountEntryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    public function rules(): array
    {
        return [
            'effective_date' => ['required', 'date'],
            'type' => ['required', Rule::in(['manual_adjustment', 'carryover'])],
            'minutes_delta' => ['required', 'integer', 'not_in:0'],
            'comment' => ['required', 'string', 'max:500'],
        ];
    }
}
