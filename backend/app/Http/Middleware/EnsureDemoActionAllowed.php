<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureDemoActionAllowed
{
    public function handle(Request $request, Closure $next, string $capability): Response
    {
        if (!config('demo.enabled')) {
            return $next($request);
        }

        if (config("demo.capabilities.{$capability}", false)) {
            return $next($request);
        }

        return response()->json([
            'message' => config("demo.messages.{$capability}", 'This action is disabled in demo mode.'),
            'demo_blocked' => true,
            'demo_capability' => $capability,
        ], 403);
    }
}
