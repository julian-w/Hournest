<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\AbsenceScope;
use App\Enums\AbsenceStatus;
use App\Enums\AbsenceType;
use App\Enums\UserRole;
use App\Enums\VacationScope;
use App\Enums\VacationStatus;
use App\Models\Absence;
use App\Models\BlackoutPeriod;
use App\Models\CostCenter;
use App\Models\TimeBooking;
use App\Models\TimeEntry;
use App\Models\User;
use App\Models\Vacation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminReportTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_aggregate_time_bookings_by_user(): void
    {
        $admin = User::factory()->create(['role' => UserRole::Admin]);
        $employee = User::factory()->create(['display_name' => 'Anna']);
        $costCenter = CostCenter::factory()->create(['code' => 'PRJ', 'name' => 'Project']);

        TimeEntry::create([
            'user_id' => $employee->id,
            'date' => '2026-04-06',
            'start_time' => '08:00',
            'end_time' => '16:00',
            'break_minutes' => 0,
        ]);

        TimeBooking::create([
            'user_id' => $employee->id,
            'date' => '2026-04-06',
            'cost_center_id' => $costCenter->id,
            'percentage' => 75,
        ]);

        $response = $this->actingAs($admin)->getJson('/api/admin/reports/time-bookings?from=2026-04-06&to=2026-04-06&group_by=user');

        $response->assertOk()
            ->assertJsonPath('data.0.group_by', 'user')
            ->assertJsonPath('data.0.label', 'Anna')
            ->assertJsonPath('data.0.percentage_points', 75)
            ->assertJsonPath('data.0.booked_minutes', 360);
    }

    public function test_admin_can_aggregate_time_bookings_by_cost_center(): void
    {
        $admin = User::factory()->create(['role' => UserRole::Admin]);
        $employee = User::factory()->create();
        $costCenter = CostCenter::factory()->create(['code' => 'INT', 'name' => 'Internal']);

        TimeEntry::create([
            'user_id' => $employee->id,
            'date' => '2026-04-06',
            'start_time' => '08:00',
            'end_time' => '12:00',
            'break_minutes' => 0,
        ]);

        TimeBooking::create([
            'user_id' => $employee->id,
            'date' => '2026-04-06',
            'cost_center_id' => $costCenter->id,
            'percentage' => 100,
        ]);

        $response = $this->actingAs($admin)->getJson('/api/admin/reports/time-bookings?from=2026-04-06&to=2026-04-06&group_by=cost_center');

        $response->assertOk()
            ->assertJsonPath('data.0.group_by', 'cost_center')
            ->assertJsonPath('data.0.label', 'Internal')
            ->assertJsonPath('data.0.code', 'INT')
            ->assertJsonPath('data.0.booked_minutes', 240);
    }

    public function test_admin_can_view_missing_entries_and_incomplete_bookings(): void
    {
        $admin = User::factory()->create(['role' => UserRole::Admin]);
        $missingEntryUser = User::factory()->create(['display_name' => 'Missing Entry']);
        $incompleteBookingUser = User::factory()->create(['display_name' => 'Incomplete Booking']);
        $costCenter = CostCenter::factory()->create();

        TimeEntry::create([
            'user_id' => $incompleteBookingUser->id,
            'date' => '2026-04-06',
            'start_time' => '08:00',
            'end_time' => '16:00',
            'break_minutes' => 0,
        ]);

        TimeBooking::create([
            'user_id' => $incompleteBookingUser->id,
            'date' => '2026-04-06',
            'cost_center_id' => $costCenter->id,
            'percentage' => 60,
        ]);

        $response = $this->actingAs($admin)->getJson('/api/admin/reports/missing-entries?from=2026-04-06&to=2026-04-06');

        $response->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonFragment([
                'user_name' => 'Missing Entry',
                'reason' => 'missing_time_entry',
                'expected_percentage' => 100,
                'actual_percentage' => 0,
                'has_time_entry' => false,
            ])
            ->assertJsonFragment([
                'user_name' => 'Incomplete Booking',
                'reason' => 'incomplete_booking',
                'expected_percentage' => 100,
                'actual_percentage' => 60,
                'has_time_entry' => true,
            ]);
    }

    public function test_missing_entries_expect_50_percent_for_half_day_vacation(): void
    {
        $admin = User::factory()->create(['role' => UserRole::Admin]);
        $employee = User::factory()->create(['display_name' => 'Half Day Vacation']);
        $costCenter = CostCenter::factory()->create();

        Vacation::create([
            'user_id' => $employee->id,
            'start_date' => '2026-04-06',
            'end_date' => '2026-04-06',
            'scope' => VacationScope::Morning,
            'status' => VacationStatus::Approved,
        ]);

        TimeEntry::create([
            'user_id' => $employee->id,
            'date' => '2026-04-06',
            'start_time' => '12:00',
            'end_time' => '16:00',
            'break_minutes' => 0,
        ]);

        TimeBooking::create([
            'user_id' => $employee->id,
            'date' => '2026-04-06',
            'cost_center_id' => $costCenter->id,
            'percentage' => 40,
        ]);

        $response = $this->actingAs($admin)->getJson('/api/admin/reports/missing-entries?from=2026-04-06&to=2026-04-06');

        $response->assertOk()
            ->assertJsonFragment([
                'user_name' => 'Half Day Vacation',
                'reason' => 'incomplete_booking',
                'expected_percentage' => 50,
                'actual_percentage' => 40,
            ]);
    }

    public function test_full_day_absence_is_not_reported_as_missing_entry(): void
    {
        $admin = User::factory()->create(['role' => UserRole::Admin]);
        $employee = User::factory()->create();

        Absence::create([
            'user_id' => $employee->id,
            'start_date' => '2026-04-06',
            'end_date' => '2026-04-06',
            'type' => AbsenceType::Illness,
            'scope' => AbsenceScope::FullDay,
            'status' => AbsenceStatus::Acknowledged,
        ]);

        $response = $this->actingAs($admin)->getJson('/api/admin/reports/missing-entries?from=2026-04-06&to=2026-04-06');

        $response->assertOk()
            ->assertJsonCount(0, 'data');
    }

    public function test_admin_can_export_time_bookings_as_csv(): void
    {
        $admin = User::factory()->create(['role' => UserRole::Admin]);
        $employee = User::factory()->create(['display_name' => 'Export User', 'email' => 'export@example.com']);
        $costCenter = CostCenter::factory()->create(['code' => 'CONS', 'name' => 'Consulting']);

        TimeEntry::create([
            'user_id' => $employee->id,
            'date' => '2026-04-06',
            'start_time' => '08:00',
            'end_time' => '16:00',
            'break_minutes' => 0,
        ]);

        TimeBooking::create([
            'user_id' => $employee->id,
            'date' => '2026-04-06',
            'cost_center_id' => $costCenter->id,
            'percentage' => 50,
            'comment' => 'Half day consulting',
        ]);

        $response = $this->actingAs($admin)->get('/api/admin/reports/export?format=csv&from=2026-04-06&to=2026-04-06');

        $response->assertOk();
        $response->assertHeader('content-type', 'text/csv; charset=UTF-8');
        $this->assertStringContainsString(
            'date,user_name,user_email,cost_center_code,cost_center_name,percentage,booked_minutes,comment',
            $response->streamedContent()
        );
        $this->assertStringContainsString(
            '2026-04-06,"Export User",export@example.com,CONS,Consulting,50,240,"Half day consulting"',
            $response->streamedContent()
        );
    }

    public function test_company_holiday_is_not_reported_as_missing_entry(): void
    {
        $admin = User::factory()->create(['role' => UserRole::Admin]);
        $employee = User::factory()->create();

        BlackoutPeriod::create([
            'type' => 'company_holiday',
            'start_date' => '2026-04-06',
            'end_date' => '2026-04-06',
            'reason' => 'Shutdown',
        ]);

        $response = $this->actingAs($admin)->getJson('/api/admin/reports/missing-entries?from=2026-04-06&to=2026-04-06');

        $response->assertOk()
            ->assertJsonCount(0, 'data');
    }

    public function test_system_bookings_without_time_entry_use_daily_target_minutes_in_reports_and_export(): void
    {
        $admin = User::factory()->create(['role' => UserRole::Admin]);
        $employee = User::factory()->create(['display_name' => 'Holiday User', 'email' => 'holiday@example.com']);
        $vacationCostCenter = CostCenter::query()->where('code', 'VACATION')->firstOrFail();

        TimeBooking::create([
            'user_id' => $employee->id,
            'date' => '2026-04-06',
            'cost_center_id' => $vacationCostCenter->id,
            'percentage' => 100,
        ]);

        $summary = $this->actingAs($admin)->getJson('/api/admin/reports/time-bookings?from=2026-04-06&to=2026-04-06&group_by=user');
        $summary->assertOk()
            ->assertJsonPath('data.0.booked_minutes', 480);

        $export = $this->actingAs($admin)->get('/api/admin/reports/export?format=csv&from=2026-04-06&to=2026-04-06');
        $this->assertStringContainsString(
            '2026-04-06,"Holiday User",holiday@example.com,VACATION,Vacation,100,480,',
            $export->streamedContent()
        );
    }

    public function test_admin_can_filter_absence_report(): void
    {
        $admin = User::factory()->create(['role' => UserRole::Admin]);
        $employee = User::factory()->create(['display_name' => 'Ada']);

        Absence::create([
            'user_id' => $employee->id,
            'start_date' => '2026-04-10',
            'end_date' => '2026-04-10',
            'type' => AbsenceType::SpecialLeave,
            'scope' => AbsenceScope::Morning,
            'status' => AbsenceStatus::Approved,
            'comment' => 'Personal',
        ]);

        $response = $this->actingAs($admin)->getJson("/api/admin/reports/absences?from=2026-04-01&to=2026-04-30&user_id={$employee->id}&type=special_leave&status=approved");

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.user_name', 'Ada')
            ->assertJsonPath('data.0.type', 'special_leave')
            ->assertJsonPath('data.0.scope', 'morning')
            ->assertJsonPath('data.0.status', 'approved');
    }

    public function test_employee_cannot_access_admin_reports(): void
    {
        $employee = User::factory()->create();

        $this->actingAs($employee)->getJson('/api/admin/reports/time-bookings?from=2026-04-06&to=2026-04-06')
            ->assertForbidden();

        $this->actingAs($employee)->getJson('/api/admin/reports/missing-entries?from=2026-04-06&to=2026-04-06')
            ->assertForbidden();

        $this->actingAs($employee)->getJson('/api/admin/reports/absences?from=2026-04-06&to=2026-04-06')
            ->assertForbidden();
    }
}
