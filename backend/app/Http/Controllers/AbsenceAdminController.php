<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Enums\AbsenceStatus;
use App\Enums\AbsenceType;
use App\Http\Requests\AdminStoreAbsenceRequest;
use App\Http\Requests\ReviewAbsenceRequest;
use App\Http\Resources\AbsenceResource;
use App\Models\Absence;
use App\Services\SystemTimeBookingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class AbsenceAdminController extends Controller
{
    public function __construct(private readonly SystemTimeBookingService $systemTimeBookingService)
    {
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Absence::with(['user', 'reviewer'])
            ->orderByDesc('start_date');

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        return AbsenceResource::collection($query->get());
    }

    public function review(ReviewAbsenceRequest $request, Absence $absence): JsonResponse
    {
        $newStatus = AbsenceStatus::from($request->status);

        // Validate status transition
        $validTransitions = [
            AbsenceStatus::Reported->value => [AbsenceStatus::Acknowledged->value],
            AbsenceStatus::Pending->value => [AbsenceStatus::Approved->value, AbsenceStatus::Rejected->value],
        ];

        $currentStatus = $absence->status->value;
        if (!isset($validTransitions[$currentStatus]) || !in_array($newStatus->value, $validTransitions[$currentStatus])) {
            return response()->json([
                'message' => 'Invalid status transition.',
            ], 422);
        }

        $absence->update([
            'status' => $newStatus,
            'admin_comment' => $request->admin_comment,
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        $this->systemTimeBookingService->syncAbsence($absence);

        $absence->load(['user', 'reviewer']);

        return response()->json([
            'data' => new AbsenceResource($absence),
            'message' => 'Absence ' . $newStatus->value . '.',
        ]);
    }

    public function store(AdminStoreAbsenceRequest $request): JsonResponse
    {
        $absence = Absence::create([
            'user_id' => $request->user_id,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'type' => AbsenceType::from($request->type),
            'scope' => $request->scope,
            'status' => AbsenceStatus::AdminCreated,
            'comment' => $request->comment,
            'admin_comment' => $request->admin_comment,
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        $this->systemTimeBookingService->syncAbsence($absence);

        $absence->load('user');

        return response()->json([
            'data' => new AbsenceResource($absence),
            'message' => 'Absence created.',
        ], 201);
    }

    public function destroy(Absence $absence): JsonResponse
    {
        $absence->delete();
        $this->systemTimeBookingService->removeAbsence($absence);

        return response()->json(['message' => 'Absence removed.']);
    }
}
