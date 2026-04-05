<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Enums\VacationScope;
use App\Enums\VacationStatus;
use App\Models\Absence;
use App\Models\BlackoutPeriod;
use App\Models\Holiday;
use App\Models\TimeEntry;
use App\Models\User;
use App\Models\Vacation;
use App\Models\WorkSchedule;
use App\Models\WorkTimeAccountEntry;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WorkTimeAccountTest extends TestCase
{
    use RefreshDatabase;

    public function test_employee_can_view_own_work_time_account(): void
    {
        $user = User::factory()->create();

        TimeEntry::create([
            'user_id' => $user->id,
            'date' => '2026-04-06',
            'start_time' => '08:00',
            'end_time' => '18:00',
            'break_minutes' => 30,
        ]);

        $response = $this->actingAs($user)->getJson('/api/work-time-account?year=2026');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.type', 'worked')
            ->assertJsonPath('data.0.minutes_delta', 90)
            ->assertJsonPath('data.0.balance_after', 90);
    }

    public function test_work_time_account_uses_half_day_target_for_half_day_vacation(): void
    {
        $user = User::factory()->create();

        Vacation::create([
            'user_id' => $user->id,
            'start_date' => '2026-04-06',
            'end_date' => '2026-04-06',
            'scope' => VacationScope::Morning,
            'status' => VacationStatus::Approved,
        ]);

        TimeEntry::create([
            'user_id' => $user->id,
            'date' => '2026-04-06',
            'start_time' => '12:00',
            'end_time' => '17:00',
            'break_minutes' => 0,
        ]);

        $response = $this->actingAs($user)->getJson('/api/work-time-account?year=2026');

        $response->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.type', 'half_day_vacation_credit')
            ->assertJsonPath('data.0.minutes_delta', 0)
            ->assertJsonPath('data.1.minutes_delta', 60);
    }

    public function test_work_time_account_can_include_manual_adjustment_and_running_balance(): void
    {
        $admin = User::factory()->create(['role' => UserRole::Admin]);
        $user = User::factory()->create();

        TimeEntry::create([
            'user_id' => $user->id,
            'date' => '2026-01-12',
            'start_time' => '08:00',
            'end_time' => '18:00',
            'break_minutes' => 0,
        ]);

        WorkTimeAccountEntry::create([
            'user_id' => $user->id,
            'effective_date' => '2026-01-13',
            'type' => 'manual_adjustment',
            'minutes_delta' => -30,
            'comment' => 'Correction',
            'created_by' => $admin->id,
        ]);

        $response = $this->actingAs($admin)->getJson("/api/admin/users/{$user->id}/work-time-account?year=2026");

        $response->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.type', 'worked')
            ->assertJsonPath('data.0.balance_after', 120)
            ->assertJsonPath('data.1.type', 'manual_adjustment')
            ->assertJsonPath('data.1.balance_after', 90)
            ->assertJsonPath('data.1.created_by_name', $admin->display_name);
    }

    public function test_previous_year_balance_is_exposed_as_opening_balance(): void
    {
        $user = User::factory()->create();

        TimeEntry::create([
            'user_id' => $user->id,
            'date' => '2025-12-30',
            'start_time' => '08:00',
            'end_time' => '17:00',
            'break_minutes' => 0,
        ]);

        $response = $this->actingAs($user)->getJson('/api/work-time-account?year=2026');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.type', 'opening_balance')
            ->assertJsonPath('data.0.balance_after', 60);
    }

    public function test_admin_can_create_and_delete_manual_work_time_account_entry(): void
    {
        $admin = User::factory()->create(['role' => UserRole::Admin]);
        $user = User::factory()->create();

        $create = $this->actingAs($admin)->postJson("/api/admin/users/{$user->id}/work-time-account", [
            'effective_date' => '2026-04-06',
            'type' => 'manual_adjustment',
            'minutes_delta' => 45,
            'comment' => 'Manual correction',
        ]);

        $create->assertStatus(201)
            ->assertJsonPath('data.type', 'manual_adjustment')
            ->assertJsonPath('data.minutes_delta', 45);

        $entryId = (int) $create->json('data.id');

        $this->assertDatabaseHas('work_time_account_entries', [
            'id' => $entryId,
            'user_id' => $user->id,
            'minutes_delta' => 45,
        ]);

        $delete = $this->actingAs($admin)->deleteJson("/api/admin/users/{$user->id}/work-time-account/{$entryId}");
        $delete->assertOk();

        $this->assertDatabaseMissing('work_time_account_entries', ['id' => $entryId]);
    }

    public function test_employee_cannot_manage_other_users_work_time_account(): void
    {
        $employee = User::factory()->create();
        $user = User::factory()->create();

        $this->actingAs($employee)->getJson("/api/admin/users/{$user->id}/work-time-account?year=2026")
            ->assertForbidden();

        $this->actingAs($employee)->postJson("/api/admin/users/{$user->id}/work-time-account", [
            'effective_date' => '2026-04-06',
            'type' => 'manual_adjustment',
            'minutes_delta' => 10,
            'comment' => 'Nope',
        ])->assertForbidden();
    }

    public function test_manual_work_time_account_entry_validates_required_fields(): void
    {
        $admin = User::factory()->create(['role' => UserRole::Admin]);
        $user = User::factory()->create();

        $response = $this->actingAs($admin)->postJson("/api/admin/users/{$user->id}/work-time-account", []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['effective_date', 'type', 'minutes_delta', 'comment']);
    }

    public function test_holiday_creates_visible_zero_delta_credit_row(): void
    {
        $user = User::factory()->create();

        Holiday::create([
            'name' => 'Easter Monday',
            'date' => '2026-04-06',
            'type' => 'fixed',
        ]);

        $response = $this->actingAs($user)->getJson('/api/work-time-account?year=2026');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.type', 'holiday_credit')
            ->assertJsonPath('data.0.minutes_delta', 0)
            ->assertJsonPath('data.0.balance_after', 0);

        $this->assertStringContainsString('Holiday "Easter Monday"', (string) $response->json('data.0.comment'));
    }

    public function test_holidays_exempt_user_does_not_get_holiday_credit_row(): void
    {
        $user = User::factory()->create(['holidays_exempt' => true]);

        Holiday::create([
            'name' => 'Exempt Holiday',
            'date' => '2026-04-06',
            'type' => 'fixed',
        ]);

        $this->actingAs($user)->getJson('/api/work-time-account?year=2026')
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }

    public function test_company_holiday_creates_visible_zero_delta_credit_row(): void
    {
        $user = User::factory()->create();

        BlackoutPeriod::create([
            'type' => 'company_holiday',
            'start_date' => '2026-04-06',
            'end_date' => '2026-04-06',
            'reason' => 'Office closed',
        ]);

        $response = $this->actingAs($user)->getJson('/api/work-time-account?year=2026');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.type', 'company_holiday_credit')
            ->assertJsonPath('data.0.minutes_delta', 0)
            ->assertJsonPath('data.0.source_type', 'blackout_period');
    }

    public function test_full_day_vacation_creates_visible_credit_row_without_changing_balance(): void
    {
        $user = User::factory()->create();

        Vacation::create([
            'user_id' => $user->id,
            'start_date' => '2026-04-06',
            'end_date' => '2026-04-06',
            'scope' => VacationScope::FullDay,
            'status' => VacationStatus::Approved,
        ]);

        $response = $this->actingAs($user)->getJson('/api/work-time-account?year=2026');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.type', 'vacation_credit')
            ->assertJsonPath('data.0.minutes_delta', 0)
            ->assertJsonPath('data.0.balance_after', 0);
    }

    public function test_full_day_illness_creates_visible_credit_row_without_changing_balance(): void
    {
        $user = User::factory()->create();

        Absence::create([
            'user_id' => $user->id,
            'start_date' => '2026-04-06',
            'end_date' => '2026-04-06',
            'type' => 'illness',
            'scope' => 'full_day',
            'status' => 'acknowledged',
        ]);

        $response = $this->actingAs($user)->getJson('/api/work-time-account?year=2026');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.type', 'absence_credit')
            ->assertJsonPath('data.0.minutes_delta', 0)
            ->assertJsonPath('data.0.balance_after', 0);

        $this->assertStringContainsString('Illness fulfilled target time', (string) $response->json('data.0.comment'));
    }

    public function test_half_day_special_leave_creates_visible_reduction_row_even_without_delta(): void
    {
        $user = User::factory()->create();

        Absence::create([
            'user_id' => $user->id,
            'start_date' => '2026-04-06',
            'end_date' => '2026-04-06',
            'type' => 'special_leave',
            'scope' => 'morning',
            'status' => 'approved',
        ]);

        TimeEntry::create([
            'user_id' => $user->id,
            'date' => '2026-04-06',
            'start_time' => '13:00',
            'end_time' => '17:00',
            'break_minutes' => 0,
        ]);

        $response = $this->actingAs($user)->getJson('/api/work-time-account?year=2026');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.type', 'half_day_absence_credit')
            ->assertJsonPath('data.0.minutes_delta', 0)
            ->assertJsonPath('data.0.balance_after', 0);

        $this->assertStringContainsString('Special leave reduced target time', (string) $response->json('data.0.comment'));
    }

    public function test_part_time_schedule_uses_correct_daily_target_in_worked_delta(): void
    {
        $user = User::factory()->create();

        WorkSchedule::create([
            'user_id' => $user->id,
            'start_date' => '2026-01-01',
            'end_date' => null,
            'work_days' => [1, 3],
            'weekly_target_minutes' => 600,
        ]);

        TimeEntry::create([
            'user_id' => $user->id,
            'date' => '2026-04-06',
            'start_time' => '08:00',
            'end_time' => '12:00',
            'break_minutes' => 0,
        ]);

        $response = $this->actingAs($user)->getJson('/api/work-time-account?year=2026');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.type', 'worked')
            ->assertJsonPath('data.0.minutes_delta', -60);

        $this->assertStringContainsString('target 300 min', (string) $response->json('data.0.comment'));
    }

    public function test_company_holiday_takes_precedence_over_full_day_vacation_in_ledger_visibility(): void
    {
        $user = User::factory()->create();

        BlackoutPeriod::create([
            'type' => 'company_holiday',
            'start_date' => '2026-04-06',
            'end_date' => '2026-04-06',
            'reason' => 'Shutdown',
        ]);

        Vacation::create([
            'user_id' => $user->id,
            'start_date' => '2026-04-06',
            'end_date' => '2026-04-06',
            'scope' => VacationScope::FullDay,
            'status' => VacationStatus::Approved,
        ]);

        $response = $this->actingAs($user)->getJson('/api/work-time-account?year=2026');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.type', 'company_holiday_credit');
    }

    public function test_removing_company_holiday_recalculates_ledger_back_to_vacation_credit(): void
    {
        $user = User::factory()->create();

        $blackout = BlackoutPeriod::create([
            'type' => 'company_holiday',
            'start_date' => '2026-04-06',
            'end_date' => '2026-04-06',
            'reason' => 'Shutdown',
        ]);

        Vacation::create([
            'user_id' => $user->id,
            'start_date' => '2026-04-06',
            'end_date' => '2026-04-06',
            'scope' => VacationScope::FullDay,
            'status' => VacationStatus::Approved,
        ]);

        $this->actingAs($user)->getJson('/api/work-time-account?year=2026')
            ->assertOk()
            ->assertJsonPath('data.0.type', 'company_holiday_credit');

        $blackout->delete();

        $this->actingAs($user)->getJson('/api/work-time-account?year=2026')
            ->assertOk()
            ->assertJsonPath('data.0.type', 'vacation_credit');
    }

    public function test_updating_absence_status_recalculates_from_no_entry_to_visible_credit_row(): void
    {
        $user = User::factory()->create();

        $absence = Absence::create([
            'user_id' => $user->id,
            'start_date' => '2026-04-06',
            'end_date' => '2026-04-06',
            'type' => 'illness',
            'scope' => 'full_day',
            'status' => 'reported',
        ]);

        $this->actingAs($user)->getJson('/api/work-time-account?year=2026')
            ->assertOk()
            ->assertJsonCount(0, 'data');

        $absence->update(['status' => 'acknowledged']);

        $this->actingAs($user)->getJson('/api/work-time-account?year=2026')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.type', 'absence_credit');
    }

    public function test_approved_vacation_and_manual_adjustment_keep_running_balance_traceable(): void
    {
        $admin = User::factory()->create(['role' => UserRole::Admin]);
        $user = User::factory()->create();

        Vacation::create([
            'user_id' => $user->id,
            'start_date' => '2026-04-06',
            'end_date' => '2026-04-06',
            'scope' => VacationScope::FullDay,
            'status' => VacationStatus::Approved,
        ]);

        WorkTimeAccountEntry::create([
            'user_id' => $user->id,
            'effective_date' => '2026-04-07',
            'type' => 'manual_adjustment',
            'minutes_delta' => 30,
            'comment' => 'Approved overtime correction',
            'created_by' => $admin->id,
        ]);

        $response = $this->actingAs($user)->getJson('/api/work-time-account?year=2026');

        $response->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.type', 'vacation_credit')
            ->assertJsonPath('data.0.balance_after', 0)
            ->assertJsonPath('data.1.type', 'manual_adjustment')
            ->assertJsonPath('data.1.balance_after', 30);
    }

    public function test_holiday_on_non_workday_does_not_create_misleading_credit_row(): void
    {
        $user = User::factory()->create();

        Holiday::create([
            'name' => 'Weekend Holiday',
            'date' => '2026-04-05',
            'type' => 'fixed',
        ]);

        $this->actingAs($user)->getJson('/api/work-time-account?year=2026')
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }

    public function test_company_holiday_still_credits_holidays_exempt_user(): void
    {
        $user = User::factory()->create(['holidays_exempt' => true]);

        BlackoutPeriod::create([
            'type' => 'company_holiday',
            'start_date' => '2026-04-06',
            'end_date' => '2026-04-06',
            'reason' => 'Company shutdown',
        ]);

        $this->actingAs($user)->getJson('/api/work-time-account?year=2026')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.type', 'company_holiday_credit');
    }

    public function test_half_day_vacation_on_part_time_schedule_uses_half_of_part_time_target(): void
    {
        $user = User::factory()->create();

        WorkSchedule::create([
            'user_id' => $user->id,
            'start_date' => '2026-01-01',
            'end_date' => null,
            'work_days' => [1, 2, 3],
            'weekly_target_minutes' => 1080,
        ]);

        Vacation::create([
            'user_id' => $user->id,
            'start_date' => '2026-04-06',
            'end_date' => '2026-04-06',
            'scope' => VacationScope::Afternoon,
            'status' => VacationStatus::Approved,
        ]);

        TimeEntry::create([
            'user_id' => $user->id,
            'date' => '2026-04-06',
            'start_time' => '08:00',
            'end_time' => '11:00',
            'break_minutes' => 0,
        ]);

        $response = $this->actingAs($user)->getJson('/api/work-time-account?year=2026');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.type', 'half_day_vacation_credit');

        $this->assertStringContainsString('180 min', (string) $response->json('data.0.comment'));
    }

    public function test_holiday_takes_precedence_over_full_day_absence_in_visible_credit_row(): void
    {
        $user = User::factory()->create();

        Holiday::create([
            'name' => 'Priority Holiday',
            'date' => '2026-04-06',
            'type' => 'fixed',
        ]);

        Absence::create([
            'user_id' => $user->id,
            'start_date' => '2026-04-06',
            'end_date' => '2026-04-06',
            'type' => 'illness',
            'scope' => 'full_day',
            'status' => 'acknowledged',
        ]);

        $this->actingAs($user)->getJson('/api/work-time-account?year=2026')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.type', 'holiday_credit');
    }
}
