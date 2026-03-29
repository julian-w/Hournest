<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Enums\VacationStatus;
use App\Http\Requests\StoreVacationRequest;
use App\Http\Resources\VacationResource;
use App\Models\Vacation;
use App\Models\VacationLedgerEntry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class VacationController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $vacations = Vacation::with('user')
            ->where('status', VacationStatus::Approved)
            ->orderBy('start_date')
            ->get();

        return VacationResource::collection($vacations);
    }

    public function mine(Request $request): AnonymousResourceCollection
    {
        $vacations = $request->user()
            ->vacations()
            ->with('reviewer')
            ->orderByDesc('start_date')
            ->get();

        return VacationResource::collection($vacations);
    }

    public function store(StoreVacationRequest $request): JsonResponse
    {
        $user = $request->user();

        // Check for overlapping approved vacations
        $overlap = $user->vacations()
            ->where('status', VacationStatus::Approved)
            ->where(function ($query) use ($request) {
                $query->where('start_date', '<=', $request->end_date)
                    ->where('end_date', '>=', $request->start_date);
            })
            ->exists();

        if ($overlap) {
            return response()->json([
                'message' => 'Vacation overlaps with an already approved vacation.',
            ], 422);
        }

        $vacation = $user->vacations()->create([
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'status' => VacationStatus::Pending,
        ]);

        return response()->json([
            'data' => new VacationResource($vacation),
            'message' => 'Vacation request submitted.',
        ], 201);
    }

    public function destroy(Request $request, Vacation $vacation): JsonResponse
    {
        if ($vacation->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        if ($vacation->status !== VacationStatus::Pending) {
            return response()->json([
                'message' => 'Only pending requests can be cancelled.',
            ], 422);
        }

        // Remove any associated ledger entries
        VacationLedgerEntry::where('vacation_id', $vacation->id)->delete();

        $vacation->delete();

        return response()->json(['message' => 'Vacation request cancelled.']);
    }
}
