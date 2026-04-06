<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Demo\DemoScenarioBuilder;
use Illuminate\Database\Seeder;

class DemoDatabaseSeeder extends Seeder
{
    public function run(): void
    {
        app(DemoScenarioBuilder::class)->seed();
    }
}
