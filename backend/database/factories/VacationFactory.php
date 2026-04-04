<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\VacationScope;
use App\Enums\VacationStatus;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class VacationFactory extends Factory
{
    public function definition(): array
    {
        $startDate = fake()->dateTimeBetween('+1 week', '+3 months');
        $endDate = (clone $startDate)->modify('+' . fake()->numberBetween(1, 10) . ' days');

        return [
            'user_id' => User::factory(),
            'start_date' => $startDate->format('Y-m-d'),
            'end_date' => $endDate->format('Y-m-d'),
            'scope' => VacationScope::FullDay,
            'status' => VacationStatus::Pending,
            'comment' => null,
            'reviewed_by' => null,
            'reviewed_at' => null,
        ];
    }

    public function approved(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => VacationStatus::Approved,
            'reviewed_by' => User::factory()->admin(),
            'reviewed_at' => now(),
        ]);
    }

    public function rejected(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => VacationStatus::Rejected,
            'comment' => 'Request denied.',
            'reviewed_by' => User::factory()->admin(),
            'reviewed_at' => now(),
        ]);
    }

    public function halfDay(string $scope = 'morning'): static
    {
        return $this->state(fn (array $attributes) => [
            'start_date' => '2026-04-06',
            'end_date' => '2026-04-06',
            'scope' => $scope,
        ]);
    }
}
