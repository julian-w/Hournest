<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSettingsRequest extends FormRequest
{
    public const ALLOWED_KEYS = [
        'default_work_days',
        'vacation_booking_start',
        'company_name',
        'weekend_is_free',
        'carryover_enabled',
        'carryover_expiry_date',
    ];

    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    public function rules(): array
    {
        return [
            'settings' => ['required', 'array'],
            'settings.*' => ['nullable'],
        ];
    }

    public function validated($key = null, $default = null): mixed
    {
        $validated = parent::validated($key, $default);

        if (isset($validated['settings']) && is_array($validated['settings'])) {
            $validated['settings'] = array_intersect_key(
                $validated['settings'],
                array_flip(self::ALLOWED_KEYS)
            );
        }

        return $validated;
    }
}
