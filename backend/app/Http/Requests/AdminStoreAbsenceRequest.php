<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Enums\AbsenceScope;
use App\Enums\AbsenceType;
use App\Models\Absence;
use App\Models\Vacation;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AdminStoreAbsenceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    public function rules(): array
    {
        return [
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'type' => ['required', Rule::enum(AbsenceType::class)],
            'scope' => ['required', Rule::enum(AbsenceScope::class)],
            'comment' => ['nullable', 'string', 'max:1000'],
            'admin_comment' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            // Half-day scope on multi-day range
            if ($this->scope !== 'full_day' && $this->start_date !== $this->end_date) {
                $validator->errors()->add('scope', 'Half-day absences must be for a single day.');
            }

            // Overlap with existing absences
            $overlapQuery = Absence::where('user_id', $this->user_id)
                ->whereNull('deleted_at')
                ->whereNotIn('status', ['rejected'])
                ->whereDate('start_date', '<=', $this->end_date)
                ->whereDate('end_date', '>=', $this->start_date);

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
            $vacationOverlap = Vacation::where('user_id', $this->user_id)
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
