<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Enums\AbsenceStatus;
use App\Enums\AbsenceType;
use App\Http\Requests\StoreAbsenceRequest;
use App\Http\Resources\AbsenceResource;
use App\Models\Absence;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class AbsenceController extends Controller
{
    public function mine(Request $request): AnonymousResourceCollection
    {
        $absences = $request->user()
            ->absences()
            ->with('reviewer')
            ->orderByDesc('start_date')
            ->get();

        return AbsenceResource::collection($absences);
    }

    public function store(StoreAbsenceRequest $request): JsonResponse
    {
        $user = $request->user();
        $type = AbsenceType::from($request->type);

        // Determine initial status based on type
        $status = match ($type) {
            AbsenceType::Illness => AbsenceStatus::Reported,
            AbsenceType::SpecialLeave => AbsenceStatus::Pending,
        };

        $absence = $user->absences()->create([
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'type' => $type,
            'scope' => $request->scope,
            'status' => $status,
            'comment' => $request->comment,
        ]);

        return response()->json([
            'data' => new AbsenceResource($absence),
            'message' => $type === AbsenceType::Illness
                ? 'Illness reported.'
                : 'Special leave requested.',
        ], 201);
    }

    public function destroy(Request $request, Absence $absence): JsonResponse
    {
        if ($absence->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        // Only allow cancellation of pending/reported absences
        if (!in_array($absence->status, [AbsenceStatus::Reported, AbsenceStatus::Pending])) {
            return response()->json([
                'message' => 'Only pending or reported absences can be cancelled.',
            ], 422);
        }

        $absence->delete();

        return response()->json(['message' => 'Absence cancelled.']);
    }
}
