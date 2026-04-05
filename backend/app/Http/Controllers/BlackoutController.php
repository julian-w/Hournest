<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Enums\BlackoutType;
use App\Http\Requests\StoreBlackoutRequest;
use App\Http\Resources\BlackoutResource;
use App\Models\BlackoutPeriod;
use App\Services\SystemTimeBookingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class BlackoutController extends Controller
{
    public function __construct(private readonly SystemTimeBookingService $systemTimeBookingService)
    {
    }

    public function index(): AnonymousResourceCollection
    {
        return BlackoutResource::collection(
            BlackoutPeriod::query()->orderBy('start_date')->orderBy('id')->get()
        );
    }

    public function store(StoreBlackoutRequest $request): JsonResponse
    {
        $blackout = BlackoutPeriod::create($request->validated());

        if ($blackout->type === BlackoutType::CompanyHoliday) {
            $this->systemTimeBookingService->syncCompanyHoliday($blackout);
        }

        return response()->json([
            'data' => new BlackoutResource($blackout),
            'message' => 'Blackout created.',
        ], 201);
    }

    public function update(StoreBlackoutRequest $request, BlackoutPeriod $blackout): JsonResponse
    {
        $previousType = $blackout->type;
        $previousBlackout = $blackout->replicate();
        $previousBlackout->id = $blackout->id;
        $blackout->update($request->validated());

        if ($previousType === BlackoutType::CompanyHoliday) {
            $this->systemTimeBookingService->removeCompanyHoliday($previousBlackout);
        }

        if ($blackout->type === BlackoutType::CompanyHoliday) {
            $this->systemTimeBookingService->syncCompanyHoliday($blackout->fresh());
        }

        return response()->json([
            'data' => new BlackoutResource($blackout->fresh()),
            'message' => 'Blackout updated.',
        ]);
    }

    public function destroy(BlackoutPeriod $blackout): JsonResponse
    {
        $previousBlackout = $blackout->replicate();
        $previousBlackout->id = $blackout->id;
        $wasCompanyHoliday = $blackout->type === BlackoutType::CompanyHoliday;
        $blackout->delete();

        if ($wasCompanyHoliday) {
            $this->systemTimeBookingService->removeCompanyHoliday($previousBlackout);
        }

        return response()->json(['message' => 'Blackout deleted.']);
    }

    public function check(Request $request): AnonymousResourceCollection
    {
        $validated = $request->validate([
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
        ]);

        $blackouts = BlackoutPeriod::query()
            ->whereDate('start_date', '<=', $validated['end_date'])
            ->whereDate('end_date', '>=', $validated['start_date'])
            ->orderByRaw("case when type = ? then 0 else 1 end", [BlackoutType::Freeze->value])
            ->orderBy('start_date')
            ->get();

        return BlackoutResource::collection($blackouts);
    }
}
