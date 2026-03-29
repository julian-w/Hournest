<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\StoreHolidayRequest;
use App\Http\Requests\UpdateHolidayRequest;
use App\Http\Resources\HolidayResource;
use App\Models\Holiday;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class HolidayController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Holiday::orderBy('date');

        if ($request->has('year')) {
            $year = (int) $request->query('year');
            $query->whereYear('date', $year);
        }

        return HolidayResource::collection($query->get());
    }

    public function store(StoreHolidayRequest $request): JsonResponse
    {
        $holiday = Holiday::create($request->validated());

        return response()->json([
            'data' => new HolidayResource($holiday),
            'message' => 'Holiday created.',
        ], 201);
    }

    public function update(UpdateHolidayRequest $request, Holiday $holiday): JsonResponse
    {
        $holiday->update($request->validated());

        return response()->json([
            'data' => new HolidayResource($holiday),
            'message' => 'Holiday updated.',
        ]);
    }

    public function destroy(Holiday $holiday): JsonResponse
    {
        $holiday->delete();

        return response()->json(['message' => 'Holiday deleted.']);
    }
}
