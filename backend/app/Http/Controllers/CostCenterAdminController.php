<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\StoreCostCenterRequest;
use App\Http\Requests\UpdateCostCenterRequest;
use App\Http\Resources\CostCenterResource;
use App\Models\CostCenter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CostCenterAdminController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $costCenters = CostCenter::withTrashed()
            ->orderBy('is_system', 'desc')
            ->orderBy('name')
            ->get();

        return CostCenterResource::collection($costCenters);
    }

    public function store(StoreCostCenterRequest $request): JsonResponse
    {
        $costCenter = CostCenter::create($request->validated());

        return response()->json([
            'data' => new CostCenterResource($costCenter),
            'message' => 'Cost center created.',
        ], 201);
    }

    public function update(UpdateCostCenterRequest $request, CostCenter $costCenter): JsonResponse
    {
        if ($costCenter->is_system) {
            return response()->json(['message' => 'System cost centers cannot be modified.'], 403);
        }

        $costCenter->update($request->validated());

        return response()->json([
            'data' => new CostCenterResource($costCenter),
            'message' => 'Cost center updated.',
        ]);
    }

    public function destroy(CostCenter $costCenter): JsonResponse
    {
        if ($costCenter->is_system) {
            return response()->json(['message' => 'System cost centers cannot be deleted.'], 403);
        }

        $costCenter->update(['is_active' => false]);
        $costCenter->delete();

        return response()->json(['message' => 'Cost center archived.']);
    }
}
