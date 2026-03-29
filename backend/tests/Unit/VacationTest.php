<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Models\Vacation;
use Tests\TestCase;
use Carbon\Carbon;

class VacationTest extends TestCase
{
    private function makeVacation(string $start, string $end): Vacation
    {
        $vacation = new Vacation();
        $vacation->start_date = Carbon::parse($start);
        $vacation->end_date = Carbon::parse($end);

        return $vacation;
    }

    public function test_count_workdays_excludes_weekends(): void
    {
        // Monday to Friday = 5 workdays
        $vacation = $this->makeVacation('2026-04-06', '2026-04-10');

        $this->assertEquals(5, $vacation->countWorkdays());
    }

    public function test_count_workdays_full_two_weeks(): void
    {
        // Monday to next Friday (2 weeks) = 10 workdays
        $vacation = $this->makeVacation('2026-04-06', '2026-04-17');

        $this->assertEquals(10, $vacation->countWorkdays());
    }

    public function test_count_workdays_single_day(): void
    {
        $vacation = $this->makeVacation('2026-04-06', '2026-04-06'); // Monday

        $this->assertEquals(1, $vacation->countWorkdays());
    }

    public function test_count_workdays_weekend_only_returns_zero(): void
    {
        $vacation = $this->makeVacation('2026-04-11', '2026-04-12'); // Saturday-Sunday

        $this->assertEquals(0, $vacation->countWorkdays());
    }

    public function test_count_workdays_filtered_by_year(): void
    {
        // Vacation spanning two years
        $vacation = $this->makeVacation('2025-12-29', '2026-01-02'); // Monday to Friday

        // Only 2026 days: Jan 1 (Thu) + Jan 2 (Fri) = 2 workdays
        $this->assertEquals(2, $vacation->countWorkdays(2026));
    }
}
