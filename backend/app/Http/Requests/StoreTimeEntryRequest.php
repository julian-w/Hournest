<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTimeEntryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['required', 'date_format:H:i', 'after:start_time'],
            'break_minutes' => ['required', 'integer', 'min:0', 'max:480'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            if ($this->start_time === null || $this->end_time === null || $this->break_minutes === null) {
                return;
            }
            $start = strtotime($this->start_time);
            $end = strtotime($this->end_time);
            if ($start !== false && $end !== false && $end > $start) {
                $totalMinutes = ($end - $start) / 60;
                if ($this->break_minutes > $totalMinutes) {
                    $validator->errors()->add('break_minutes', 'Break cannot exceed total work duration.');
                }
            }
        });
    }
}
