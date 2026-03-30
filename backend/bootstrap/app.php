<?php

use App\Http\Middleware\SecurityHeaders;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        health: '/up',
    )
    ->withSchedule(function (Schedule $schedule) {
        // Run yearly maintenance on January 1st at 00:30
        $schedule->command('hournest:yearly-maintenance')->yearlyOn(1, 1, '00:30');
        // Run expiry check on the 1st of each month at 01:00
        $schedule->command('hournest:yearly-maintenance')->monthlyOn(1, '01:00');
    })
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->statefulApi();
        $middleware->append(SecurityHeaders::class);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
