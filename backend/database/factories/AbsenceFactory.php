<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\AbsenceScope;
use App\Enums\AbsenceStatus;
use App\Enums\AbsenceType;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class AbsenceFactory extends Factory
{
    public function definition(): array
    {
        $startDate = fake()->dateTimeBetween('+1 week', '+3 months');
        $endDate = (clone $startDate)->modify('+' . fake()->numberBetween(1, 5) . ' days');

        return [
            'user_id' => User::factory(),
            'start_date' => $startDate->format('Y-m-d'),
            'end_date' => $endDate->format('Y-m-d'),
            'type' => AbsenceType::Illness,
            'scope' => AbsenceScope::FullDay,
            'status' => AbsenceStatus::Reported,
            'comment' => null,
            'admin_comment' => null,
            'reviewed_by' => null,
            'reviewed_at' => null,
        ];
    }

    public function acknowledged(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => AbsenceStatus::Acknowledged,
            'reviewed_by' => User::factory()->admin(),
            'reviewed_at' => now(),
        ]);
    }

    public function approved(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => AbsenceType::SpecialLeave,
            'status' => AbsenceStatus::Approved,
            'reviewed_by' => User::factory()->admin(),
            'reviewed_at' => now(),
        ]);
    }

    public function adminCreated(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => AbsenceStatus::AdminCreated,
            'reviewed_by' => User::factory()->admin(),
            'reviewed_at' => now(),
        ]);
    }

    public function specialLeave(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => AbsenceType::SpecialLeave,
            'status' => AbsenceStatus::Pending,
        ]);
    }
}
