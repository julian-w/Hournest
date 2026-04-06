<?php

declare(strict_types=1);

namespace App\Demo;

use App\Enums\AbsenceScope;
use App\Enums\AbsenceStatus;
use App\Enums\AbsenceType;
use App\Enums\BlackoutType;
use App\Enums\HolidayType;
use App\Enums\LedgerEntryType;
use App\Enums\UserRole;
use App\Enums\VacationScope;
use App\Enums\VacationStatus;
use App\Models\Absence;
use App\Models\BlackoutPeriod;
use App\Models\CostCenter;
use App\Models\Holiday;
use App\Models\Setting;
use App\Models\TimeBooking;
use App\Models\TimeBookingTemplate;
use App\Models\TimeEntry;
use App\Models\TimeLock;
use App\Models\User;
use App\Models\UserGroup;
use App\Models\Vacation;
use App\Models\VacationLedgerEntry;
use App\Models\WorkSchedule;
use App\Models\WorkTimeAccountEntry;
use App\Services\SystemTimeBookingService;
use Carbon\Carbon;

class DemoScenarioBuilder
{
    /**
     * Sync rule:
     * When this generator changes, update the documented scenario catalog in documentation/docs/dev/demo-mode*.md
     * and the coverage assertions in DemoRefreshCommandTest in the same change. These three artifacts must stay aligned.
     */
    private const USER_BLUEPRINTS = [
        [
            'key' => 'admin',
            'email' => 'anna.admin@demo.hournest.local',
            'display_name' => 'Anna Admin',
            'role' => UserRole::Admin,
            'vacation_days_per_year' => 30,
            'holidays_exempt' => false,
            'weekend_worker' => false,
            'login_hint' => 'Admin with global visibility, review flows, and leadership scenarios.',
        ],
        [
            'key' => 'max',
            'email' => 'max.mustermann@demo.hournest.local',
            'display_name' => 'Max Mustermann',
            'role' => UserRole::Employee,
            'vacation_days_per_year' => 30,
            'holidays_exempt' => false,
            'weekend_worker' => false,
            'login_hint' => 'Approved and pending vacation, carryover, and approved morning special leave.',
        ],
        [
            'key' => 'sarah',
            'email' => 'sarah.schmidt@demo.hournest.local',
            'display_name' => 'Sarah Schmidt',
            'role' => UserRole::Employee,
            'vacation_days_per_year' => 28,
            'holidays_exempt' => false,
            'weekend_worker' => false,
            'login_hint' => 'Rejected vacation, acknowledged illness, and support-heavy time bookings.',
        ],
        [
            'key' => 'tom',
            'email' => 'tom.weber@demo.hournest.local',
            'display_name' => 'Tom Weber',
            'role' => UserRole::Employee,
            'vacation_days_per_year' => 30,
            'holidays_exempt' => true,
            'weekend_worker' => false,
            'login_hint' => 'Holiday-exempt employee with long vacation and temporary work schedule.',
        ],
        [
            'key' => 'lisa',
            'email' => 'lisa.braun@demo.hournest.local',
            'display_name' => 'Lisa Braun',
            'role' => UserRole::Employee,
            'vacation_days_per_year' => 30,
            'holidays_exempt' => false,
            'weekend_worker' => true,
            'login_hint' => 'Weekend worker with pending special leave and weekend time tracking.',
        ],
        [
            'key' => 'mona',
            'email' => 'mona.keller@demo.hournest.local',
            'display_name' => 'Mona Keller',
            'role' => UserRole::Employee,
            'vacation_days_per_year' => 24,
            'holidays_exempt' => false,
            'weekend_worker' => false,
            'login_hint' => 'Part-time profile with afternoon half-day vacation and rejected special leave.',
        ],
    ];

    /**
     * @var array<int, array<string, bool>>
     */
    private array $occupiedDates = [];

    public function __construct(private readonly SystemTimeBookingService $systemTimeBookingService)
    {
    }

    public function seed(): void
    {
        $referenceDate = $this->resolveReferenceDate();
        $users = $this->seedUsers();
        $costCenters = $this->seedBusinessCostCenters();

        $this->seedSettings();
        $this->seedHolidays([
            $referenceDate->year - 1,
            $referenceDate->year,
            $referenceDate->year + 1,
        ]);
        $this->seedGroupsAndAssignments($users, $costCenters);
        $this->seedWorkSchedules($users, $referenceDate);
        $this->seedVacationLedgerBase($users, $referenceDate);
        $this->seedWorkTimeAccountEntries($users, $referenceDate);
        $this->seedVacations($users, $referenceDate);
        $this->seedAbsences($users, $referenceDate);
        $this->seedBlackouts($users['admin'], $referenceDate);
        $this->seedTemplates($users, $costCenters);
        $this->seedTimeEntriesAndBookings($users, $costCenters, $referenceDate);
        $this->seedTimeLocks($users['admin'], $referenceDate);

        if ($this->usesFullDatasetVariant()) {
            $this->seedAdditionalFullDatasetScenarios($users, $costCenters, $referenceDate);
        }
    }

    private function resolveReferenceDate(): Carbon
    {
        $configured = config('demo.reference_date', 'now');
        if (!is_string($configured) || trim($configured) === '' || strtolower(trim($configured)) === 'now') {
            return Carbon::today();
        }

        return Carbon::parse($configured)->startOfDay();
    }

    private function usesFullDatasetVariant(): bool
    {
        $variant = strtolower(trim((string) config('demo.dataset_variant', 'standard')));

        return $variant === 'full';
    }

    /**
     * @return array<int, array{email: string, display_name: string, role: string, login_hint: string}>
     */
    public static function documentedDemoUsers(): array
    {
        return array_map(
            static fn (array $blueprint): array => [
                'email' => $blueprint['email'],
                'display_name' => $blueprint['display_name'],
                'role' => $blueprint['role']->value,
                'login_hint' => $blueprint['login_hint'],
            ],
            self::USER_BLUEPRINTS
        );
    }

    /**
     * @return array<string, User>
     */
    private function seedUsers(): array
    {
        $loginPassword = (string) config('demo.login_password', 'demo-password');
        $users = [];

        foreach (self::USER_BLUEPRINTS as $blueprint) {
            $users[$blueprint['key']] = User::create([
                'email' => $blueprint['email'],
                'display_name' => $blueprint['display_name'],
                'password' => $loginPassword,
                'must_change_password' => false,
                'role' => $blueprint['role'],
                'vacation_days_per_year' => $blueprint['vacation_days_per_year'],
                'holidays_exempt' => $blueprint['holidays_exempt'],
                'weekend_worker' => $blueprint['weekend_worker'],
            ]);
        }

        return $users;
    }

    /**
     * @return array<string, CostCenter>
     */
    private function seedBusinessCostCenters(): array
    {
        return [
            'client_delivery' => CostCenter::create([
                'code' => 'CLIENT-DELIVERY',
                'name' => 'Client Delivery',
                'description' => 'Billable customer work and sprint delivery',
            ]),
            'support' => CostCenter::create([
                'code' => 'SUPPORT',
                'name' => 'Support',
                'description' => 'Customer support, inbox and hotline coverage',
            ]),
            'internal' => CostCenter::create([
                'code' => 'INTERNAL',
                'name' => 'Internal',
                'description' => 'Meetings, administration and internal work',
            ]),
            'rnd' => CostCenter::create([
                'code' => 'RND',
                'name' => 'Research & Development',
                'description' => 'Product improvements and prototypes',
            ]),
            'sales' => CostCenter::create([
                'code' => 'SALES',
                'name' => 'Sales',
                'description' => 'Pre-sales, demos and customer workshops',
            ]),
        ];
    }

    /**
     * @param  array<string, User>  $users
     * @param  array<string, CostCenter>  $costCenters
     */
    private function seedGroupsAndAssignments(array $users, array $costCenters): void
    {
        $engineering = UserGroup::create([
            'name' => 'Engineering',
            'description' => 'Delivery and product work',
        ]);
        $engineering->members()->attach([$users['max']->id, $users['mona']->id]);
        $engineering->costCenters()->attach([
            $costCenters['client_delivery']->id,
            $costCenters['rnd']->id,
            $costCenters['internal']->id,
        ]);

        $support = UserGroup::create([
            'name' => 'Support',
            'description' => 'Support and operations coverage',
        ]);
        $support->members()->attach([$users['sarah']->id, $users['lisa']->id, $users['tom']->id]);
        $support->costCenters()->attach([
            $costCenters['support']->id,
            $costCenters['internal']->id,
        ]);

        $leadership = UserGroup::create([
            'name' => 'Leadership',
            'description' => 'Admin and planning visibility',
        ]);
        $leadership->members()->attach([$users['admin']->id]);
        $leadership->costCenters()->attach([
            $costCenters['sales']->id,
            $costCenters['internal']->id,
        ]);

        $users['admin']->costCenters()->attach(array_map(
            static fn (CostCenter $costCenter): int => $costCenter->id,
            $costCenters
        ));
        $users['tom']->costCenters()->attach([$costCenters['sales']->id]);
        $users['lisa']->costCenters()->attach([$costCenters['support']->id]);

        $users['max']->costCenterFavorites()->attach([
            $costCenters['client_delivery']->id => ['sort_order' => 0],
            $costCenters['internal']->id => ['sort_order' => 1],
        ]);
        $users['sarah']->costCenterFavorites()->attach([
            $costCenters['support']->id => ['sort_order' => 0],
            $costCenters['internal']->id => ['sort_order' => 1],
        ]);
        $users['mona']->costCenterFavorites()->attach([
            $costCenters['rnd']->id => ['sort_order' => 0],
            $costCenters['internal']->id => ['sort_order' => 1],
        ]);
    }

    private function seedSettings(): void
    {
        Setting::set('default_work_days', [1, 2, 3, 4, 5]);
        Setting::set('default_weekly_target_minutes', 2400);
        Setting::set('weekend_is_free', true);
        Setting::set('carryover_enabled', true);
        Setting::set('carryover_expiry_date', '31.03');
        Setting::set('vacation_booking_start', '01.10');
    }

    /**
     * @param  array<int, int>  $years
     */
    private function seedHolidays(array $years): void
    {
        foreach ($years as $year) {
            foreach ($this->buildGermanHolidaySet($year) as $holiday) {
                Holiday::create($holiday);
            }
        }
    }

    /**
     * @return array<int, array{name: string, date: string, type: HolidayType}>
     */
    private function buildGermanHolidaySet(int $year): array
    {
        $easterSunday = Carbon::createMidnightDate($year, 3, 21)->addDays(easter_days($year));

        return [
            ['name' => 'New Year\'s Day', 'date' => Carbon::createMidnightDate($year, 1, 1)->toDateString(), 'type' => HolidayType::Fixed],
            ['name' => 'Good Friday', 'date' => $easterSunday->copy()->subDays(2)->toDateString(), 'type' => HolidayType::Variable],
            ['name' => 'Easter Monday', 'date' => $easterSunday->copy()->addDay()->toDateString(), 'type' => HolidayType::Variable],
            ['name' => 'Labour Day', 'date' => Carbon::createMidnightDate($year, 5, 1)->toDateString(), 'type' => HolidayType::Fixed],
            ['name' => 'Ascension Day', 'date' => $easterSunday->copy()->addDays(39)->toDateString(), 'type' => HolidayType::Variable],
            ['name' => 'Whit Monday', 'date' => $easterSunday->copy()->addDays(50)->toDateString(), 'type' => HolidayType::Variable],
            ['name' => 'German Unity Day', 'date' => Carbon::createMidnightDate($year, 10, 3)->toDateString(), 'type' => HolidayType::Fixed],
            ['name' => 'Christmas Day', 'date' => Carbon::createMidnightDate($year, 12, 25)->toDateString(), 'type' => HolidayType::Fixed],
            ['name' => 'Second Christmas Day', 'date' => Carbon::createMidnightDate($year, 12, 26)->toDateString(), 'type' => HolidayType::Fixed],
        ];
    }

    /**
     * @param  array<string, User>  $users
     */
    private function seedWorkSchedules(array $users, Carbon $referenceDate): void
    {
        WorkSchedule::create([
            'user_id' => $users['mona']->id,
            'start_date' => Carbon::createMidnightDate($referenceDate->year, 1, 1),
            'end_date' => null,
            'work_days' => [2, 3, 4],
            'weekly_target_minutes' => 1440,
        ]);

        WorkSchedule::create([
            'user_id' => $users['tom']->id,
            'start_date' => $referenceDate->copy()->addDays(45),
            'end_date' => $referenceDate->copy()->addDays(150),
            'work_days' => [1, 2, 3, 4],
            'weekly_target_minutes' => 1920,
        ]);
    }

    /**
     * @param  array<string, User>  $users
     */
    private function seedVacationLedgerBase(array $users, Carbon $referenceDate): void
    {
        $year = $referenceDate->year;

        foreach ($users as $user) {
            VacationLedgerEntry::create([
                'user_id' => $user->id,
                'year' => $year,
                'type' => LedgerEntryType::Entitlement,
                'days' => $user->vacation_days_per_year,
                'comment' => sprintf('Annual vacation entitlement for %d', $year),
            ]);
        }

        VacationLedgerEntry::create([
            'user_id' => $users['max']->id,
            'year' => $year,
            'type' => LedgerEntryType::Carryover,
            'days' => 3.0,
            'comment' => sprintf('Carryover from %d', $year - 1),
        ]);

        if ($referenceDate->greaterThan(Carbon::createMidnightDate($year, 3, 31))) {
            VacationLedgerEntry::create([
                'user_id' => $users['max']->id,
                'year' => $year,
                'type' => LedgerEntryType::Expired,
                'days' => -1.0,
                'comment' => 'Expired carryover after 31.03',
            ]);
        }

        VacationLedgerEntry::create([
            'user_id' => $users['tom']->id,
            'year' => $year,
            'type' => LedgerEntryType::Bonus,
            'days' => 2.0,
            'comment' => 'On-call season bonus',
        ]);

        VacationLedgerEntry::create([
            'user_id' => $users['mona']->id,
            'year' => $year,
            'type' => LedgerEntryType::Adjustment,
            'days' => 0.5,
            'comment' => 'Manual correction after contract change',
        ]);

        VacationLedgerEntry::create([
            'user_id' => $users['sarah']->id,
            'year' => $year - 1,
            'type' => LedgerEntryType::Expired,
            'days' => -0.5,
            'comment' => sprintf('Expired carryover from %d', $year - 1),
        ]);
    }

    /**
     * @param  array<string, User>  $users
     */
    private function seedWorkTimeAccountEntries(array $users, Carbon $referenceDate): void
    {
        WorkTimeAccountEntry::create([
            'user_id' => $users['max']->id,
            'effective_date' => Carbon::createMidnightDate($referenceDate->year - 1, 12, 31),
            'type' => 'manual_adjustment',
            'minutes_delta' => 120,
            'comment' => 'Carryover from previous year',
            'created_by' => $users['admin']->id,
        ]);

        WorkTimeAccountEntry::create([
            'user_id' => $users['max']->id,
            'effective_date' => Carbon::createMidnightDate($referenceDate->year, 2, 10),
            'type' => 'manual_adjustment',
            'minutes_delta' => -30,
            'comment' => 'Compensation for private appointment',
            'created_by' => $users['admin']->id,
        ]);

        WorkTimeAccountEntry::create([
            'user_id' => $users['mona']->id,
            'effective_date' => Carbon::createMidnightDate($referenceDate->year, 1, 15),
            'type' => 'manual_adjustment',
            'minutes_delta' => 45,
            'comment' => 'Onboarding overtime correction',
            'created_by' => $users['admin']->id,
        ]);
    }

    /**
     * @param  array<string, User>  $users
     */
    private function seedVacations(array $users, Carbon $referenceDate): void
    {
        $maxApprovedStart = $this->workdayOnOrAfter($users['max'], $referenceDate->copy()->subDays(28));
        $this->createVacation(
            user: $users['max'],
            reviewer: $users['admin'],
            status: VacationStatus::Approved,
            startDate: $maxApprovedStart,
            endDate: $maxApprovedStart->copy()->addDays(5)
        );

        $maxPendingStart = $this->workdayOnOrAfter($users['max'], $referenceDate->copy()->addDays(18));
        $this->createVacation(
            user: $users['max'],
            reviewer: null,
            status: VacationStatus::Pending,
            startDate: $maxPendingStart,
            endDate: $maxPendingStart->copy()->addDays(4),
            comment: 'Summer trip'
        );

        $sarahRejectedStart = $this->workdayOnOrAfter($users['sarah'], $referenceDate->copy()->addDays(8));
        $this->createVacation(
            user: $users['sarah'],
            reviewer: $users['admin'],
            status: VacationStatus::Rejected,
            startDate: $sarahRejectedStart,
            endDate: $sarahRejectedStart->copy()->addDays(4),
            comment: 'Team coverage is too tight in that week.'
        );

        $tomApprovedStart = $this->workdayOnOrAfter($users['tom'], $referenceDate->copy()->addDays(35));
        $this->createVacation(
            user: $users['tom'],
            reviewer: $users['admin'],
            status: VacationStatus::Approved,
            startDate: $tomApprovedStart,
            endDate: $tomApprovedStart->copy()->addDays(18)
        );

        $annaHalfDay = $this->workdayOnOrBefore($users['admin'], $referenceDate->copy()->subDays(3));
        $this->createVacation(
            user: $users['admin'],
            reviewer: $users['admin'],
            status: VacationStatus::Approved,
            startDate: $annaHalfDay,
            endDate: $annaHalfDay->copy(),
            scope: VacationScope::Morning,
            comment: 'Family appointment'
        );

        $monaHalfDay = $this->workdayOnOrBefore($users['mona'], $referenceDate->copy()->subDays(10));
        $this->createVacation(
            user: $users['mona'],
            reviewer: $users['admin'],
            status: VacationStatus::Approved,
            startDate: $monaHalfDay,
            endDate: $monaHalfDay->copy(),
            scope: VacationScope::Afternoon,
            comment: 'Moving appointment'
        );
    }

    /**
     * @param  array<string, User>  $users
     */
    private function seedAbsences(array $users, Carbon $referenceDate): void
    {
        $sarahIllnessStart = $this->workdayOnOrBefore($users['sarah'], $referenceDate->copy()->subDays(7));
        $this->createAbsence(
            user: $users['sarah'],
            reviewer: $users['admin'],
            type: AbsenceType::Illness,
            status: AbsenceStatus::Acknowledged,
            startDate: $sarahIllnessStart,
            endDate: $sarahIllnessStart->copy()->addDay(),
            comment: 'Flu symptoms',
            adminComment: 'Get well soon'
        );

        $tomAdminCreated = $this->workdayOnOrBefore($users['tom'], $referenceDate->copy()->subDays(2));
        $this->createAbsence(
            user: $users['tom'],
            reviewer: $users['admin'],
            type: AbsenceType::Illness,
            status: AbsenceStatus::AdminCreated,
            startDate: $tomAdminCreated,
            endDate: $tomAdminCreated->copy(),
            comment: 'Medical appointment confirmed by HR'
        );

        $lisaPending = $this->workdayOnOrAfter($users['lisa'], $referenceDate->copy()->addDays(6));
        $this->createAbsence(
            user: $users['lisa'],
            reviewer: null,
            type: AbsenceType::SpecialLeave,
            status: AbsenceStatus::Pending,
            startDate: $lisaPending,
            endDate: $lisaPending->copy(),
            scope: AbsenceScope::Afternoon,
            comment: 'Family ceremony'
        );

        $monaRejected = $this->workdayOnOrAfter($users['mona'], $referenceDate->copy()->addDays(12));
        $this->createAbsence(
            user: $users['mona'],
            reviewer: $users['admin'],
            type: AbsenceType::SpecialLeave,
            status: AbsenceStatus::Rejected,
            startDate: $monaRejected,
            endDate: $monaRejected->copy(),
            comment: 'Requested bridge day',
            adminComment: 'Please use vacation for that date.'
        );

        $maxApprovedMorning = $this->workdayOnOrAfter($users['max'], $referenceDate->copy()->addDays(15));
        $this->createAbsence(
            user: $users['max'],
            reviewer: $users['admin'],
            type: AbsenceType::SpecialLeave,
            status: AbsenceStatus::Approved,
            startDate: $maxApprovedMorning,
            endDate: $maxApprovedMorning->copy(),
            scope: AbsenceScope::Morning,
            comment: 'Parent-teacher conference',
            adminComment: 'Approved as special leave'
        );
    }

    private function seedBlackouts(User $admin, Carbon $referenceDate): void
    {
        BlackoutPeriod::create([
            'type' => BlackoutType::Freeze,
            'start_date' => $referenceDate->copy()->addDays(24),
            'end_date' => $referenceDate->copy()->addDays(31),
            'reason' => 'Quarter-end delivery freeze',
        ]);

        $companyHoliday = BlackoutPeriod::create([
            'type' => BlackoutType::CompanyHoliday,
            'start_date' => Carbon::createMidnightDate($referenceDate->year, 12, 24),
            'end_date' => Carbon::createMidnightDate($referenceDate->year, 12, 31),
            'reason' => 'Winter company holiday',
        ]);

        $this->systemTimeBookingService->syncCompanyHoliday($companyHoliday);
    }

    /**
     * @param  array<string, User>  $users
     * @param  array<string, CostCenter>  $costCenters
     */
    private function seedTemplates(array $users, array $costCenters): void
    {
        $maxTemplate = TimeBookingTemplate::create([
            'user_id' => $users['max']->id,
            'name' => 'Customer Sprint',
        ]);
        $maxTemplate->items()->createMany([
            ['cost_center_id' => $costCenters['client_delivery']->id, 'percentage' => 80],
            ['cost_center_id' => $costCenters['internal']->id, 'percentage' => 20],
        ]);

        $sarahTemplate = TimeBookingTemplate::create([
            'user_id' => $users['sarah']->id,
            'name' => 'Support Focus',
        ]);
        $sarahTemplate->items()->createMany([
            ['cost_center_id' => $costCenters['support']->id, 'percentage' => 100],
        ]);

        $monaTemplate = TimeBookingTemplate::create([
            'user_id' => $users['mona']->id,
            'name' => 'Part-time Product Mix',
        ]);
        $monaTemplate->items()->createMany([
            ['cost_center_id' => $costCenters['rnd']->id, 'percentage' => 60],
            ['cost_center_id' => $costCenters['internal']->id, 'percentage' => 40],
        ]);
    }

    /**
     * @param  array<string, User>  $users
     * @param  array<string, CostCenter>  $costCenters
     */
    private function seedTimeEntriesAndBookings(array $users, array $costCenters, Carbon $referenceDate): void
    {
        $maxDay = $this->findPreviousFreeWorkDay($users['max'], $referenceDate->copy()->subDays(4));
        $this->seedWorkingDay(
            user: $users['max'],
            date: $maxDay,
            startTime: '08:15',
            endTime: '17:00',
            breakMinutes: 45,
            bookings: [
                $costCenters['client_delivery']->id => 70,
                $costCenters['internal']->id => 30,
            ]
        );

        $sarahDay = $this->findPreviousFreeWorkDay($users['sarah'], $referenceDate->copy()->subDays(4));
        $this->seedWorkingDay(
            user: $users['sarah'],
            date: $sarahDay,
            startTime: '08:00',
            endTime: '16:30',
            breakMinutes: 30,
            bookings: [
                $costCenters['support']->id => 100,
            ]
        );

        $monaDay = $this->findPreviousFreeWorkDay($users['mona'], $referenceDate->copy()->subDays(6));
        $this->seedWorkingDay(
            user: $users['mona'],
            date: $monaDay,
            startTime: '09:00',
            endTime: '15:30',
            breakMinutes: 30,
            bookings: [
                $costCenters['rnd']->id => 60,
                $costCenters['internal']->id => 40,
            ]
        );

        $lisaWeekend = $this->findPreviousFreeWeekendWorkDay($users['lisa'], $referenceDate->copy()->subDays(1));
        $this->seedWorkingDay(
            user: $users['lisa'],
            date: $lisaWeekend,
            startTime: '10:00',
            endTime: '16:00',
            breakMinutes: 30,
            bookings: [
                $costCenters['support']->id => 100,
            ]
        );
    }

    private function seedTimeLocks(User $admin, Carbon $referenceDate): void
    {
        $lockedMonth = $referenceDate->copy()->startOfMonth()->subMonth();

        TimeLock::create([
            'year' => $lockedMonth->year,
            'month' => $lockedMonth->month,
            'locked_by' => $admin->id,
            'locked_at' => $referenceDate->copy()->subDays(2),
        ]);
    }

    /**
     * @param  array<string, User>  $users
     * @param  array<string, CostCenter>  $costCenters
     */
    private function seedAdditionalFullDatasetScenarios(array $users, array $costCenters, Carbon $referenceDate): void
    {
        $this->seedAdditionalFullVacations($users, $referenceDate);
        $this->seedAdditionalFullAbsences($users, $referenceDate);
        $this->seedAdditionalFullTemplates($users, $costCenters);
        $this->seedAdditionalFullTimeEntriesAndBookings($users, $costCenters, $referenceDate);
        $this->seedAdditionalFullTimeLocks($users['admin'], $referenceDate);
    }

    /**
     * @param  array<string, User>  $users
     */
    private function seedAdditionalFullVacations(array $users, Carbon $referenceDate): void
    {
        $sarahApproved = $this->workdayOnOrAfter($users['sarah'], $referenceDate->copy()->addDays(48));
        $this->createVacation(
            user: $users['sarah'],
            reviewer: $users['admin'],
            status: VacationStatus::Approved,
            startDate: $sarahApproved,
            endDate: $sarahApproved->copy()->addDays(2),
            comment: 'Late summer recharge'
        );

        $lisaPendingHalfDay = $this->workdayOnOrAfter($users['lisa'], $referenceDate->copy()->addDays(20));
        $this->createVacation(
            user: $users['lisa'],
            reviewer: null,
            status: VacationStatus::Pending,
            startDate: $lisaPendingHalfDay,
            endDate: $lisaPendingHalfDay->copy(),
            scope: VacationScope::Morning,
            comment: 'School event'
        );

        $monaRejected = $this->workdayOnOrAfter($users['mona'], $referenceDate->copy()->addDays(28));
        $this->createVacation(
            user: $users['mona'],
            reviewer: $users['admin'],
            status: VacationStatus::Rejected,
            startDate: $monaRejected,
            endDate: $monaRejected->copy()->addDays(1),
            comment: 'Overlap with release week'
        );
    }

    /**
     * @param  array<string, User>  $users
     */
    private function seedAdditionalFullAbsences(array $users, Carbon $referenceDate): void
    {
        $annaApproved = $this->workdayOnOrBefore($users['admin'], $referenceDate->copy()->subDays(12));
        $this->createAbsence(
            user: $users['admin'],
            reviewer: $users['admin'],
            type: AbsenceType::SpecialLeave,
            status: AbsenceStatus::Approved,
            startDate: $annaApproved,
            endDate: $annaApproved->copy(),
            comment: 'Conference moderation'
        );

        $lisaAcknowledged = $this->workdayOnOrBefore($users['lisa'], $referenceDate->copy()->subDays(9));
        $this->createAbsence(
            user: $users['lisa'],
            reviewer: $users['admin'],
            type: AbsenceType::Illness,
            status: AbsenceStatus::Acknowledged,
            startDate: $lisaAcknowledged,
            endDate: $lisaAcknowledged->copy(),
            scope: AbsenceScope::Afternoon,
            comment: 'Migraine',
            adminComment: 'Confirmed for the afternoon'
        );

        $tomPendingMorning = $this->workdayOnOrAfter($users['tom'], $referenceDate->copy()->addDays(26));
        $this->createAbsence(
            user: $users['tom'],
            reviewer: null,
            type: AbsenceType::SpecialLeave,
            status: AbsenceStatus::Pending,
            startDate: $tomPendingMorning,
            endDate: $tomPendingMorning->copy(),
            scope: AbsenceScope::Morning,
            comment: 'School enrollment appointment'
        );
    }

    /**
     * @param  array<string, User>  $users
     * @param  array<string, CostCenter>  $costCenters
     */
    private function seedAdditionalFullTemplates(array $users, array $costCenters): void
    {
        $adminTemplate = TimeBookingTemplate::create([
            'user_id' => $users['admin']->id,
            'name' => 'Leadership Review Week',
        ]);
        $adminTemplate->items()->createMany([
            ['cost_center_id' => $costCenters['sales']->id, 'percentage' => 50],
            ['cost_center_id' => $costCenters['internal']->id, 'percentage' => 50],
        ]);

        $lisaTemplate = TimeBookingTemplate::create([
            'user_id' => $users['lisa']->id,
            'name' => 'Weekend Support Mix',
        ]);
        $lisaTemplate->items()->createMany([
            ['cost_center_id' => $costCenters['support']->id, 'percentage' => 80],
            ['cost_center_id' => $costCenters['internal']->id, 'percentage' => 20],
        ]);
    }

    /**
     * @param  array<string, User>  $users
     * @param  array<string, CostCenter>  $costCenters
     */
    private function seedAdditionalFullTimeEntriesAndBookings(array $users, array $costCenters, Carbon $referenceDate): void
    {
        $this->seedWorkingDay(
            user: $users['max'],
            date: $this->findPreviousFreeWorkDay($users['max'], $referenceDate->copy()->subDays(8)),
            startTime: '08:30',
            endTime: '17:15',
            breakMinutes: 45,
            bookings: [
                $costCenters['client_delivery']->id => 60,
                $costCenters['rnd']->id => 20,
                $costCenters['internal']->id => 20,
            ]
        );

        $this->seedWorkingDay(
            user: $users['sarah'],
            date: $this->findPreviousFreeWorkDay($users['sarah'], $referenceDate->copy()->subDays(10)),
            startTime: '07:45',
            endTime: '16:15',
            breakMinutes: 30,
            bookings: [
                $costCenters['support']->id => 70,
                $costCenters['internal']->id => 30,
            ]
        );

        $this->seedWorkingDay(
            user: $users['tom'],
            date: $this->findPreviousFreeWorkDay($users['tom'], $referenceDate->copy()->subDays(11)),
            startTime: '08:00',
            endTime: '16:45',
            breakMinutes: 45,
            bookings: [
                $costCenters['support']->id => 50,
                $costCenters['sales']->id => 30,
                $costCenters['internal']->id => 20,
            ]
        );

        $this->seedWorkingDay(
            user: $users['mona'],
            date: $this->findPreviousFreeWorkDay($users['mona'], $referenceDate->copy()->subDays(13)),
            startTime: '08:45',
            endTime: '15:15',
            breakMinutes: 30,
            bookings: [
                $costCenters['rnd']->id => 70,
                $costCenters['internal']->id => 30,
            ]
        );

        $this->seedWorkingDay(
            user: $users['admin'],
            date: $this->findPreviousFreeWorkDay($users['admin'], $referenceDate->copy()->subDays(5)),
            startTime: '08:00',
            endTime: '17:30',
            breakMinutes: 45,
            bookings: [
                $costCenters['sales']->id => 40,
                $costCenters['internal']->id => 60,
            ]
        );

        $this->seedWorkingDay(
            user: $users['lisa'],
            date: $this->findPreviousFreeWeekendWorkDay($users['lisa'], $referenceDate->copy()->subDays(8)),
            startTime: '09:30',
            endTime: '15:00',
            breakMinutes: 30,
            bookings: [
                $costCenters['support']->id => 100,
            ]
        );
    }

    private function seedAdditionalFullTimeLocks(User $admin, Carbon $referenceDate): void
    {
        $olderLockedMonth = $referenceDate->copy()->startOfMonth()->subMonths(2);

        TimeLock::create([
            'year' => $olderLockedMonth->year,
            'month' => $olderLockedMonth->month,
            'locked_by' => $admin->id,
            'locked_at' => $referenceDate->copy()->subDays(20),
        ]);
    }

    private function createVacation(
        User $user,
        ?User $reviewer,
        VacationStatus $status,
        Carbon $startDate,
        Carbon $endDate,
        VacationScope $scope = VacationScope::FullDay,
        ?string $comment = null,
    ): Vacation {
        $vacation = Vacation::create([
            'user_id' => $user->id,
            'start_date' => $startDate,
            'end_date' => $endDate,
            'scope' => $scope,
            'status' => $status,
            'comment' => $comment,
            'reviewed_by' => $reviewer?->id,
            'reviewed_at' => $reviewer ? now() : null,
        ]);

        if ($status === VacationStatus::Approved) {
            $vacation->load('user');
            VacationLedgerEntry::create([
                'user_id' => $user->id,
                'year' => $startDate->year,
                'type' => LedgerEntryType::Taken,
                'days' => -$vacation->countWorkdays(),
                'comment' => sprintf(
                    '%s vacation %s to %s',
                    $scope === VacationScope::FullDay ? 'Approved' : 'Half-day',
                    $startDate->toDateString(),
                    $endDate->toDateString()
                ),
                'vacation_id' => $vacation->id,
            ]);

            $this->systemTimeBookingService->syncVacation($vacation);
            $this->markOccupied($user, $startDate, $endDate);
        }

        return $vacation;
    }

    private function createAbsence(
        User $user,
        ?User $reviewer,
        AbsenceType $type,
        AbsenceStatus $status,
        Carbon $startDate,
        Carbon $endDate,
        AbsenceScope $scope = AbsenceScope::FullDay,
        ?string $comment = null,
        ?string $adminComment = null,
    ): Absence {
        $absence = Absence::create([
            'user_id' => $user->id,
            'start_date' => $startDate,
            'end_date' => $endDate,
            'type' => $type,
            'scope' => $scope,
            'status' => $status,
            'comment' => $comment,
            'admin_comment' => $adminComment,
            'reviewed_by' => $reviewer?->id,
            'reviewed_at' => $reviewer ? now() : null,
        ]);

        if (in_array($status, [AbsenceStatus::Acknowledged, AbsenceStatus::Approved, AbsenceStatus::AdminCreated], true)) {
            $this->systemTimeBookingService->syncAbsence($absence);
            $this->markOccupied($user, $startDate, $endDate);
        }

        return $absence;
    }

    /**
     * @param  array<int, int>  $bookings
     */
    private function seedWorkingDay(
        User $user,
        Carbon $date,
        string $startTime,
        string $endTime,
        int $breakMinutes,
        array $bookings,
    ): void {
        TimeEntry::create([
            'user_id' => $user->id,
            'date' => $date->toDateString(),
            'start_time' => $startTime,
            'end_time' => $endTime,
            'break_minutes' => $breakMinutes,
        ]);

        foreach ($bookings as $costCenterId => $percentage) {
            TimeBooking::create([
                'user_id' => $user->id,
                'date' => $date->toDateString(),
                'cost_center_id' => $costCenterId,
                'percentage' => $percentage,
            ]);
        }

        $this->occupiedDates[$user->id][$date->toDateString()] = true;
    }

    private function markOccupied(User $user, Carbon $startDate, Carbon $endDate): void
    {
        $cursor = $startDate->copy()->startOfDay();
        $last = $endDate->copy()->startOfDay();

        while ($cursor->lte($last)) {
            $this->occupiedDates[$user->id][$cursor->toDateString()] = true;
            $cursor->addDay();
        }
    }

    private function workdayOnOrAfter(User $user, Carbon $date): Carbon
    {
        $candidate = $date->copy()->startOfDay();

        while (!$user->isWorkDay($candidate)) {
            $candidate->addDay();
        }

        return $candidate;
    }

    private function workdayOnOrBefore(User $user, Carbon $date): Carbon
    {
        $candidate = $date->copy()->startOfDay();

        while (!$user->isWorkDay($candidate)) {
            $candidate->subDay();
        }

        return $candidate;
    }

    private function findPreviousFreeWorkDay(User $user, Carbon $startDate): Carbon
    {
        $candidate = $startDate->copy()->startOfDay();

        while (
            !$user->isWorkDay($candidate)
            || ($this->occupiedDates[$user->id][$candidate->toDateString()] ?? false)
        ) {
            $candidate->subDay();
        }

        return $candidate;
    }

    private function findPreviousFreeWeekendWorkDay(User $user, Carbon $startDate): Carbon
    {
        $candidate = $startDate->copy()->startOfDay();

        while (
            !$user->isWorkDay($candidate)
            || !in_array($candidate->dayOfWeekIso, [6, 7], true)
            || ($this->occupiedDates[$user->id][$candidate->toDateString()] ?? false)
        ) {
            $candidate->subDay();
        }

        return $candidate;
    }
}
