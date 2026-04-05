<?php

declare(strict_types=1);

use App\Http\Controllers\AbsenceAdminController;
use App\Http\Controllers\AbsenceController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\AdminReportController;
use App\Http\Controllers\AuthController;
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
use App\Http\Middleware\EnsureAdmin;
use App\Http\Middleware\EnsurePasswordChanged;
use App\Http\Resources\UserResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Auth routes (no auth required)
Route::get('/auth/config', [AuthController::class, 'config']);
if (config('auth.oauth_enabled')) {
    Route::get('/auth/redirect', [AuthController::class, 'redirect']);
    Route::get('/auth/callback', [AuthController::class, 'callback']);
}
Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:5,1');

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::post('/auth/change-password', [AuthController::class, 'changePassword'])->middleware('throttle:5,1');

    Route::get('/user', function (Request $request) {
        return new UserResource($request->user());
    });

    // Routes below require password to be changed
    Route::middleware(EnsurePasswordChanged::class)->group(function () {

    // Vacations
    Route::get('/vacations', [VacationController::class, 'index']);
    Route::get('/vacations/mine', [VacationController::class, 'mine']);
    Route::post('/vacations', [VacationController::class, 'store']);
    Route::delete('/vacations/{vacation}', [VacationController::class, 'destroy']);

    // Vacation Ledger (own)
    Route::get('/vacation-ledger', [VacationLedgerController::class, 'index']);

    // Holidays (read for everyone)
    Route::get('/holidays', [HolidayController::class, 'index']);

    // Settings (read for everyone)
    Route::get('/settings', [SettingController::class, 'index']);

    // Time Tracking
    Route::get('/time-entries', [TimeEntryController::class, 'index']);
    Route::put('/time-entries/{date}', [TimeEntryController::class, 'store']);
    Route::delete('/time-entries/{date}', [TimeEntryController::class, 'destroy']);

    // Time Bookings
    Route::get('/time-bookings', [TimeBookingController::class, 'index']);
    Route::put('/time-bookings/{date}', [TimeBookingController::class, 'store']);

    // Time Booking Templates
    Route::get('/time-booking-templates', [TimeBookingTemplateController::class, 'index']);
    Route::post('/time-booking-templates', [TimeBookingTemplateController::class, 'store']);
    Route::patch('/time-booking-templates/{timeBookingTemplate}', [TimeBookingTemplateController::class, 'update']);
    Route::delete('/time-booking-templates/{timeBookingTemplate}', [TimeBookingTemplateController::class, 'destroy']);

    // Cost Centers (own available)
    Route::get('/cost-centers', [CostCenterController::class, 'index']);

    // Cost Center Favorites
    Route::get('/cost-center-favorites', [CostCenterFavoriteController::class, 'index']);
    Route::post('/cost-center-favorites', [CostCenterFavoriteController::class, 'store']);
    Route::delete('/cost-center-favorites/{costCenterId}', [CostCenterFavoriteController::class, 'destroy']);
    Route::patch('/cost-center-favorites/reorder', [CostCenterFavoriteController::class, 'reorder']);

    // Absences (own)
    Route::get('/absences/mine', [AbsenceController::class, 'mine']);
    Route::post('/absences', [AbsenceController::class, 'store']);
    Route::delete('/absences/{absence}', [AbsenceController::class, 'destroy']);

    // Admin routes
    Route::middleware(EnsureAdmin::class)->prefix('admin')->group(function () {
        // Existing
        Route::get('/vacations/pending', [AdminController::class, 'pendingVacations']);
        Route::patch('/vacations/{vacation}', [AdminController::class, 'reviewVacation']);
        Route::get('/users', [AdminController::class, 'users']);
        Route::post('/users', [AdminController::class, 'createUser']);
        Route::patch('/users/{user}', [AdminController::class, 'updateUser']);
        Route::delete('/users/{user}', [AdminController::class, 'deleteUser']);
        Route::patch('/users/{user}/reset-password', [AdminController::class, 'resetUserPassword']);

        // Holidays CRUD
        Route::post('/holidays', [HolidayController::class, 'store']);
        Route::patch('/holidays/{holiday}', [HolidayController::class, 'update']);
        Route::delete('/holidays/{holiday}', [HolidayController::class, 'destroy']);

        // Settings
        Route::put('/settings', [SettingController::class, 'update']);

        // Work Schedules per user
        Route::get('/users/{user}/work-schedules', [WorkScheduleController::class, 'index']);
        Route::post('/users/{user}/work-schedules', [WorkScheduleController::class, 'store']);
        Route::patch('/work-schedules/{workSchedule}', [WorkScheduleController::class, 'update']);
        Route::delete('/work-schedules/{workSchedule}', [WorkScheduleController::class, 'destroy']);

        // Vacation Ledger per user (admin)
        Route::get('/users/{user}/vacation-ledger', [VacationLedgerController::class, 'adminIndex']);
        Route::post('/users/{user}/vacation-ledger', [VacationLedgerController::class, 'store']);

        // Cost Centers (admin CRUD)
        Route::get('/cost-centers', [CostCenterAdminController::class, 'index']);
        Route::post('/cost-centers', [CostCenterAdminController::class, 'store']);
        Route::patch('/cost-centers/{costCenter}', [CostCenterAdminController::class, 'update']);
        Route::delete('/cost-centers/{costCenter}', [CostCenterAdminController::class, 'destroy']);

        // User Groups
        Route::get('/user-groups', [UserGroupController::class, 'index']);
        Route::post('/user-groups', [UserGroupController::class, 'store']);
        Route::patch('/user-groups/{userGroup}', [UserGroupController::class, 'update']);
        Route::delete('/user-groups/{userGroup}', [UserGroupController::class, 'destroy']);
        Route::put('/user-groups/{userGroup}/members', [UserGroupController::class, 'setMembers']);
        Route::put('/user-groups/{userGroup}/cost-centers', [UserGroupController::class, 'setCostCenters']);

        // Direct cost center assignment per user
        Route::get('/users/{user}/cost-centers', [TimeBookingAdminController::class, 'userCostCenters']);
        Route::put('/users/{user}/cost-centers', [TimeBookingAdminController::class, 'setUserCostCenters']);

        // Absence management
        Route::get('/absences', [AbsenceAdminController::class, 'index']);
        Route::patch('/absences/{absence}', [AbsenceAdminController::class, 'review']);
        Route::post('/absences', [AbsenceAdminController::class, 'store']);
        Route::delete('/absences/{absence}', [AbsenceAdminController::class, 'destroy']);

        // Time booking admin
        Route::get('/time-bookings', [TimeBookingAdminController::class, 'index']);
        Route::put('/time-bookings/{userId}/{date}/entry', [TimeBookingAdminController::class, 'storeEntry']);
        Route::put('/time-bookings/{userId}/{date}/bookings', [TimeBookingAdminController::class, 'storeBookings']);

        // Time locks
        Route::get('/time-locks', [TimeBookingAdminController::class, 'locks']);
        Route::post('/time-locks', [TimeBookingAdminController::class, 'toggleLock']);

        // Reports
        Route::get('/reports/time-bookings', [AdminReportController::class, 'timeBookings']);
        Route::get('/reports/missing-entries', [AdminReportController::class, 'missingEntries']);
        Route::get('/reports/export', [AdminReportController::class, 'export']);
    });

    }); // end EnsurePasswordChanged group
});
