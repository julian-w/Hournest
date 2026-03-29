<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\StoreWorkScheduleRequest;
use App\Http\Requests\UpdateWorkScheduleRequest;
use App\Http\Resources\WorkScheduleResource;
use App\Models\User;
use App\Models\WorkSchedule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class WorkScheduleController extends Controller
{
    public function index(User $user): AnonymousResourceCollection
    {
        $schedules = $user->workSchedules()
            ->orderByDesc('start_date')
            ->get();

        return WorkScheduleResource::collection($schedules);
    }

    public function store(StoreWorkScheduleRequest $request, User $user): JsonResponse
    {
        $schedule = $user->workSchedules()->create($request->validated());

        return response()->json([
            'data' => new WorkScheduleResource($schedule),
            'message' => 'Work schedule created.',
        ], 201);
    }

    public function update(UpdateWorkScheduleRequest $request, WorkSchedule $workSchedule): JsonResponse
    {
        $workSchedule->update($request->validated());

        return response()->json([
            'data' => new WorkScheduleResource($workSchedule),
            'message' => 'Work schedule updated.',
        ]);
    }

    public function destroy(WorkSchedule $workSchedule): JsonResponse
    {
        $workSchedule->delete();

        return response()->json(['message' => 'Work schedule deleted.']);
    }
}
