<?php

declare(strict_types=1);

use App\Http\Controllers\AbsenceAdminController;
use App\Http\Controllers\AbsenceController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\AdminReportController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BlackoutController;
use App\Http\Controllers\CostCenterAdminController;
use App\Http\Controllers\CostCenterController;
use App\Http\Controllers\CostCenterFavoriteController;
use App\Http\Controllers\HolidayController;
use App\Http\Controllers\SettingController;
use App\Http\Controllers\TimeBookingAdminController;
use App\Http\Controllers\TimeBookingController;
use App\Http\Controllers\TimeBookingTemplateController;
use App\Http\Controllers\TimeEntryController;
use App\Http\Controllers\UserGroupController;
use App\Http\Controllers\VacationController;
use App\Http\Controllers\VacationLedgerController;
use App\Http\Controllers\WorkScheduleController;
use App\Http\Controllers\WorkTimeAccountController;
use App\Http\Middleware\EnsureAdmin;
use App\Http\Middleware\EnsurePasswordChanged;
use App\Http\Resources\UserResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

$authThrottle = app()->environment('e2e') ? 'throttle:60,1' : 'throttle:5,1';

// Auth routes (no auth required)
Route::get('/auth/config', [AuthController::class, 'config']);
if (config('auth.oauth_enabled')) {
    Route::get('/auth/redirect', [AuthController::class, 'redirect']);
    Route::get('/auth/callback', [AuthController::class, 'callback']);
}
Route::post('/auth/login', [AuthController::class, 'login'])->middleware($authThrottle);

// Protected routes
Route::middleware('auth:sanctum')->group(function () use ($authThrottle) {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::post('/auth/change-password', [AuthController::class, 'changePassword'])
        ->middleware([$authThrottle, 'demo:password_change']);

    Route::get('/user', function (Request $request) {
        return new UserResource($request->user());
    });

    // Routes below require password to be changed
    Route::middleware(EnsurePasswordChanged::class)->group(function () {

    // Vacations
    Route::get('/vacations', [VacationController::class, 'index']);
    Route::get('/vacations/mine', [VacationController::class, 'mine']);
    Route::post('/vacations', [VacationController::class, 'store'])->middleware('demo:vacation_requests');
    Route::delete('/vacations/{vacation}', [VacationController::class, 'destroy'])->middleware('demo:vacation_requests');

    // Vacation Ledger (own)
    Route::get('/vacation-ledger', [VacationLedgerController::class, 'index']);

    // Holidays (read for everyone)
    Route::get('/holidays', [HolidayController::class, 'index']);

    // Blackouts (check for everyone with access)
    Route::get('/blackouts/check', [BlackoutController::class, 'check']);

    // Settings (read for everyone)
    Route::get('/settings', [SettingController::class, 'index']);

    // Own work schedules
    Route::get('/work-schedules/mine', [WorkScheduleController::class, 'mine']);

    // Own work time account
    Route::get('/work-time-account', [WorkTimeAccountController::class, 'index']);

    // Time Tracking
    Route::get('/time-entries', [TimeEntryController::class, 'index']);
    Route::put('/time-entries/{date}', [TimeEntryController::class, 'store'])->middleware('demo:time_tracking');
    Route::delete('/time-entries/{date}', [TimeEntryController::class, 'destroy'])->middleware('demo:time_tracking');

    // Time Bookings
    Route::get('/time-bookings', [TimeBookingController::class, 'index']);
    Route::put('/time-bookings/{date}', [TimeBookingController::class, 'store'])->middleware('demo:time_tracking');

    // Time Booking Templates
    Route::get('/time-booking-templates', [TimeBookingTemplateController::class, 'index']);
    Route::post('/time-booking-templates', [TimeBookingTemplateController::class, 'store'])->middleware('demo:time_booking_templates');
    Route::patch('/time-booking-templates/{timeBookingTemplate}', [TimeBookingTemplateController::class, 'update'])->middleware('demo:time_booking_templates');
    Route::delete('/time-booking-templates/{timeBookingTemplate}', [TimeBookingTemplateController::class, 'destroy'])->middleware('demo:time_booking_templates');

    // Cost Centers (own available)
    Route::get('/cost-centers', [CostCenterController::class, 'index']);

    // Cost Center Favorites
    Route::get('/cost-center-favorites', [CostCenterFavoriteController::class, 'index']);
    Route::post('/cost-center-favorites', [CostCenterFavoriteController::class, 'store'])->middleware('demo:favorites');
    Route::delete('/cost-center-favorites/{costCenterId}', [CostCenterFavoriteController::class, 'destroy'])->middleware('demo:favorites');
    Route::patch('/cost-center-favorites/reorder', [CostCenterFavoriteController::class, 'reorder'])->middleware('demo:favorites');

    // Absences (own)
    Route::get('/absences/mine', [AbsenceController::class, 'mine']);
    Route::post('/absences', [AbsenceController::class, 'store'])->middleware('demo:absence_requests');
    Route::delete('/absences/{absence}', [AbsenceController::class, 'destroy'])->middleware('demo:absence_requests');

    // Admin routes
    Route::middleware(EnsureAdmin::class)->prefix('admin')->group(function () {
        // Existing
        Route::get('/vacations/pending', [AdminController::class, 'pendingVacations']);
        Route::patch('/vacations/{vacation}', [AdminController::class, 'reviewVacation'])->middleware('demo:admin_reviews');
        Route::get('/users', [AdminController::class, 'users']);
        Route::post('/users', [AdminController::class, 'createUser'])->middleware('demo:user_management');
        Route::patch('/users/{user}', [AdminController::class, 'updateUser'])->middleware('demo:user_management');
        Route::delete('/users/{user}', [AdminController::class, 'deleteUser'])->middleware('demo:user_management');
        Route::patch('/users/{user}/reset-password', [AdminController::class, 'resetUserPassword'])->middleware('demo:user_management');

        // Holidays CRUD
        Route::post('/holidays', [HolidayController::class, 'store'])->middleware('demo:holiday_management');
        Route::patch('/holidays/{holiday}', [HolidayController::class, 'update'])->middleware('demo:holiday_management');
        Route::delete('/holidays/{holiday}', [HolidayController::class, 'destroy'])->middleware('demo:holiday_management');

        // Blackouts CRUD
        Route::get('/blackouts', [BlackoutController::class, 'index']);
        Route::post('/blackouts', [BlackoutController::class, 'store'])->middleware('demo:blackout_management');
        Route::patch('/blackouts/{blackout}', [BlackoutController::class, 'update'])->middleware('demo:blackout_management');
        Route::delete('/blackouts/{blackout}', [BlackoutController::class, 'destroy'])->middleware('demo:blackout_management');

        // Settings
        Route::put('/settings', [SettingController::class, 'update'])->middleware('demo:settings_management');

        // Work Schedules per user
        Route::get('/users/{user}/work-schedules', [WorkScheduleController::class, 'index']);
        Route::post('/users/{user}/work-schedules', [WorkScheduleController::class, 'store'])->middleware('demo:work_schedule_management');
        Route::patch('/work-schedules/{workSchedule}', [WorkScheduleController::class, 'update'])->middleware('demo:work_schedule_management');
        Route::delete('/work-schedules/{workSchedule}', [WorkScheduleController::class, 'destroy'])->middleware('demo:work_schedule_management');

        // Vacation Ledger per user (admin)
        Route::get('/users/{user}/vacation-ledger', [VacationLedgerController::class, 'adminIndex']);
        Route::post('/users/{user}/vacation-ledger', [VacationLedgerController::class, 'store'])->middleware('demo:vacation_ledger_management');
        Route::delete('/users/{user}/vacation-ledger/{entry}', [VacationLedgerController::class, 'destroy'])->middleware('demo:vacation_ledger_management');

        // Work time account per user (admin)
        Route::get('/users/{user}/work-time-account', [WorkTimeAccountController::class, 'adminIndex']);
        Route::post('/users/{user}/work-time-account', [WorkTimeAccountController::class, 'store'])->middleware('demo:work_time_account_management');
        Route::delete('/users/{user}/work-time-account/{entry}', [WorkTimeAccountController::class, 'destroy'])->middleware('demo:work_time_account_management');

        // Cost Centers (admin CRUD)
        Route::get('/cost-centers', [CostCenterAdminController::class, 'index']);
        Route::post('/cost-centers', [CostCenterAdminController::class, 'store'])->middleware('demo:cost_center_management');
        Route::patch('/cost-centers/{costCenter}', [CostCenterAdminController::class, 'update'])->middleware('demo:cost_center_management');
        Route::delete('/cost-centers/{costCenter}', [CostCenterAdminController::class, 'destroy'])->middleware('demo:cost_center_management');

        // User Groups
        Route::get('/user-groups', [UserGroupController::class, 'index']);
        Route::post('/user-groups', [UserGroupController::class, 'store'])->middleware('demo:user_group_management');
        Route::patch('/user-groups/{userGroup}', [UserGroupController::class, 'update'])->middleware('demo:user_group_management');
        Route::delete('/user-groups/{userGroup}', [UserGroupController::class, 'destroy'])->middleware('demo:user_group_management');
        Route::put('/user-groups/{userGroup}/members', [UserGroupController::class, 'setMembers'])->middleware('demo:user_group_management');
        Route::put('/user-groups/{userGroup}/cost-centers', [UserGroupController::class, 'setCostCenters'])->middleware('demo:user_group_management');

        // Direct cost center assignment per user
        Route::get('/users/{user}/cost-centers', [TimeBookingAdminController::class, 'userCostCenters']);
        Route::put('/users/{user}/cost-centers', [TimeBookingAdminController::class, 'setUserCostCenters'])->middleware('demo:user_cost_center_management');

        // Absence management
        Route::get('/absences', [AbsenceAdminController::class, 'index']);
        Route::patch('/absences/{absence}', [AbsenceAdminController::class, 'review'])->middleware('demo:admin_reviews');
        Route::post('/absences', [AbsenceAdminController::class, 'store'])->middleware('demo:admin_reviews');
        Route::delete('/absences/{absence}', [AbsenceAdminController::class, 'destroy'])->middleware('demo:admin_reviews');

        // Time booking admin
        Route::get('/time-bookings', [TimeBookingAdminController::class, 'index']);
        Route::put('/time-bookings/{userId}/{date}/entry', [TimeBookingAdminController::class, 'storeEntry'])->middleware('demo:time_tracking');
        Route::put('/time-bookings/{userId}/{date}/bookings', [TimeBookingAdminController::class, 'storeBookings'])->middleware('demo:time_tracking');

        // Time locks
        Route::get('/time-locks', [TimeBookingAdminController::class, 'locks']);
        Route::post('/time-locks', [TimeBookingAdminController::class, 'toggleLock'])->middleware('demo:time_lock_management');

        // Reports
        Route::get('/reports/time-bookings', [AdminReportController::class, 'timeBookings']);
        Route::get('/reports/missing-entries', [AdminReportController::class, 'missingEntries']);
        Route::get('/reports/absences', [AdminReportController::class, 'absences']);
        Route::get('/reports/export', [AdminReportController::class, 'export']);
    });

    }); // end EnsurePasswordChanged group
});
