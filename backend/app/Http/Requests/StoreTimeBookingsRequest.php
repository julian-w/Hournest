<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTimeBookingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'bookings' => ['required', 'array', 'min:1'],
            'bookings.*.cost_center_id' => ['required', 'integer', 'exists:cost_centers,id'],
            'bookings.*.percentage' => ['required', 'integer', 'min:5', 'max:100'],
            'bookings.*.comment' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $bookings = $this->input('bookings', []);
            $total = array_sum(array_column($bookings, 'percentage'));
            if ($total !== 100) {
                $validator->errors()->add('bookings', 'Percentages must sum to exactly 100%.');
            }

            foreach ($bookings as $index => $booking) {
                if (isset($booking['percentage']) && $booking['percentage'] % 5 !== 0) {
                    $validator->errors()->add("bookings.{$index}.percentage", 'Percentage must be a multiple of 5.');
                }
            }

            $ids = array_column($bookings, 'cost_center_id');
            if (count($ids) !== count(array_unique($ids))) {
                $validator->errors()->add('bookings', 'Duplicate cost centers are not allowed.');
            }
        });
    }
}
