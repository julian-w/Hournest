<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Enums\AbsenceScope;
use App\Enums\AbsenceType;
use App\Models\Absence;
use App\Models\Vacation;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAbsenceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'type' => ['required', Rule::enum(AbsenceType::class)],
            'scope' => ['required', Rule::enum(AbsenceScope::class)],
            'comment' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            if ($this->start_date === null || $this->end_date === null || $this->scope === null) {
                return;
            }

            // Half-day scope on multi-day range
            if ($this->scope !== 'full_day' && $this->start_date !== $this->end_date) {
                $validator->errors()->add('scope', 'Half-day absences must be for a single day.');
            }

            // Overlap with existing absences (full overlap check)
            $overlapQuery = Absence::where('user_id', $this->user()->id)
                ->whereNull('deleted_at')
                ->whereNotIn('status', ['rejected'])
                ->whereDate('start_date', '<=', $this->end_date)
                ->whereDate('end_date', '>=', $this->start_date);

            // For half-day absences, allow if other half-day on same day has DIFFERENT scope
            if ($this->scope !== 'full_day' && $this->start_date === $this->end_date) {
                $overlapQuery->where(function ($q) {
                    $q->where('scope', 'full_day')
                      ->orWhere('scope', $this->scope);
                });
            }

            if ($overlapQuery->exists()) {
                $validator->errors()->add('start_date', 'An absence already exists for this period.');
            }

            // Overlap with approved vacations
            $vacationOverlap = Vacation::where('user_id', $this->user()->id)
                ->where('status', 'approved')
                ->whereDate('start_date', '<=', $this->end_date)
                ->whereDate('end_date', '>=', $this->start_date)
                ->exists();
            if ($vacationOverlap) {
                $validator->errors()->add('start_date', 'An approved vacation already exists for this period.');
            }
        });
    }
}
