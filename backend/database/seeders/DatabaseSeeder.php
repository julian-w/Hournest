<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\HolidayType;
use App\Enums\LedgerEntryType;
use App\Enums\UserRole;
use App\Enums\VacationStatus;
use App\Models\Holiday;
use App\Models\Setting;
use App\Models\User;
use App\Models\Vacation;
use App\Models\VacationLedgerEntry;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Seed default settings
        Setting::set('default_work_days', [1, 2, 3, 4, 5]);
        Setting::set('weekend_is_free', true);
        Setting::set('carryover_expiry_date', null);
        Setting::set('carryover_enabled', true);

        // Seed German public holidays for 2026
        $holidays = [
            ['name' => 'New Year\'s Day', 'date' => '2026-01-01', 'type' => HolidayType::Fixed],
            ['name' => 'Good Friday', 'date' => '2026-04-03', 'type' => HolidayType::Variable],
            ['name' => 'Easter Monday', 'date' => '2026-04-06', 'type' => HolidayType::Variable],
            ['name' => 'Labour Day', 'date' => '2026-05-01', 'type' => HolidayType::Fixed],
            ['name' => 'Ascension Day', 'date' => '2026-05-14', 'type' => HolidayType::Variable],
            ['name' => 'Whit Monday', 'date' => '2026-05-25', 'type' => HolidayType::Variable],
            ['name' => 'German Unity Day', 'date' => '2026-10-03', 'type' => HolidayType::Fixed],
            ['name' => 'Christmas Day', 'date' => '2026-12-25', 'type' => HolidayType::Fixed],
            ['name' => 'Second Christmas Day', 'date' => '2026-12-26', 'type' => HolidayType::Fixed],
        ];

        foreach ($holidays as $holiday) {
            Holiday::create($holiday);
        }

        // Seed users
        $admin = User::create([
            'email' => 'admin@hournest.local',
            'display_name' => 'Anna Admin',
            'role' => UserRole::Admin,
            'vacation_days_per_year' => 30,
            'oidc_id' => 'oidc-admin-001',
        ]);

        $max = User::create([
            'email' => 'max@hournest.local',
            'display_name' => 'Max Mustermann',
            'role' => UserRole::Employee,
            'vacation_days_per_year' => 30,
            'oidc_id' => 'oidc-user-001',
        ]);

        $sarah = User::create([
            'email' => 'sarah@hournest.local',
            'display_name' => 'Sarah Schmidt',
            'role' => UserRole::Employee,
            'vacation_days_per_year' => 28,
            'oidc_id' => 'oidc-user-002',
        ]);

        $tom = User::create([
            'email' => 'tom@hournest.local',
            'display_name' => 'Tom Weber',
            'role' => UserRole::Employee,
            'vacation_days_per_year' => 30,
            'oidc_id' => 'oidc-user-003',
        ]);

        // Seed ledger entries (entitlement for 2026)
        foreach ([$admin, $max, $sarah, $tom] as $user) {
            VacationLedgerEntry::create([
                'user_id' => $user->id,
                'year' => 2026,
                'type' => LedgerEntryType::Entitlement,
                'days' => $user->vacation_days_per_year,
                'comment' => 'Annual vacation entitlement for 2026',
            ]);
        }

        // Approved vacations
        $maxVacation1 = Vacation::create([
            'user_id' => $max->id,
            'start_date' => '2026-04-06',
            'end_date' => '2026-04-17',
            'status' => VacationStatus::Approved,
            'reviewed_by' => $admin->id,
            'reviewed_at' => now(),
        ]);

        // Create corresponding ledger entry for approved vacation
        VacationLedgerEntry::create([
            'user_id' => $max->id,
            'year' => 2026,
            'type' => LedgerEntryType::Taken,
            'days' => -9, // 10 workdays minus Easter Monday holiday
            'comment' => 'Vacation 2026-04-06 to 2026-04-17',
            'vacation_id' => $maxVacation1->id,
        ]);

        $sarahVacation1 = Vacation::create([
            'user_id' => $sarah->id,
            'start_date' => '2026-05-18',
            'end_date' => '2026-05-29',
            'status' => VacationStatus::Approved,
            'reviewed_by' => $admin->id,
            'reviewed_at' => now(),
        ]);

        VacationLedgerEntry::create([
            'user_id' => $sarah->id,
            'year' => 2026,
            'type' => LedgerEntryType::Taken,
            'days' => -9, // 10 workdays minus Whit Monday
            'comment' => 'Vacation 2026-05-18 to 2026-05-29',
            'vacation_id' => $sarahVacation1->id,
        ]);

        $tomVacation1 = Vacation::create([
            'user_id' => $tom->id,
            'start_date' => '2026-07-06',
            'end_date' => '2026-07-24',
            'status' => VacationStatus::Approved,
            'reviewed_by' => $admin->id,
            'reviewed_at' => now(),
        ]);

        VacationLedgerEntry::create([
            'user_id' => $tom->id,
            'year' => 2026,
            'type' => LedgerEntryType::Taken,
            'days' => -15, // 15 workdays (3 weeks)
            'comment' => 'Vacation 2026-07-06 to 2026-07-24',
            'vacation_id' => $tomVacation1->id,
        ]);

        // Pending vacation
        Vacation::create([
            'user_id' => $max->id,
            'start_date' => '2026-08-03',
            'end_date' => '2026-08-14',
            'status' => VacationStatus::Pending,
        ]);

        // Rejected vacation
        Vacation::create([
            'user_id' => $sarah->id,
            'start_date' => '2026-04-06',
            'end_date' => '2026-04-10',
            'status' => VacationStatus::Rejected,
            'comment' => 'Too many team members already on leave.',
            'reviewed_by' => $admin->id,
            'reviewed_at' => now(),
        ]);
    }
}
