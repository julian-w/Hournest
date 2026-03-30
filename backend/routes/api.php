<?php

declare(strict_types=1);

use App\Http\Controllers\AdminController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\HolidayController;
use App\Http\Controllers\SettingController;
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
    });

    }); // end EnsurePasswordChanged group
});
