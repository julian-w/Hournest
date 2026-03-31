<?php

declare(strict_types=1);

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class CostCenterFactory extends Factory
{
    public function definition(): array
    {
        return [
            'code' => fake()->unique()->bothify('CC-####'),
            'name' => fake()->words(2, true),
            'description' => null,
            'is_system' => false,
            'is_active' => true,
        ];
    }

    public function system(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_system' => true,
        ]);
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }
}
