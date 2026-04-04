<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreTimeBookingTemplateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.cost_center_id' => ['required', 'integer', 'exists:cost_centers,id'],
            'items.*.percentage' => ['required', 'integer', 'min:5', 'max:100', 'multiple_of:5'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $items = $this->input('items', []);
            if (!is_array($items) || $items === []) {
                return;
            }

            $total = collect($items)->sum(fn ($item): int => (int) ($item['percentage'] ?? 0));
            if ($total !== 100) {
                $validator->errors()->add('items', 'Template percentages must add up to 100.');
            }

            $costCenterIds = collect($items)->pluck('cost_center_id')->filter()->all();
            if (count($costCenterIds) !== count(array_unique($costCenterIds))) {
                $validator->errors()->add('items', 'Each cost center may only appear once per template.');
            }
        });
    }
}
