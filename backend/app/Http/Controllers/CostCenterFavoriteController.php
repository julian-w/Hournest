<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Resources\CostCenterResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CostCenterFavoriteController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $favorites = $request->user()->costCenterFavorites;

        return CostCenterResource::collection($favorites);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'cost_center_id' => ['required', 'integer', 'exists:cost_centers,id'],
        ]);

        $user = $request->user();

        // Verify cost center is available to user
        $available = $user->availableCostCenters()->pluck('id');
        if (!$available->contains($request->cost_center_id)) {
            return response()->json(['message' => 'Cost center not available.'], 422);
        }

        $maxOrder = $user->costCenterFavorites()->max('cost_center_favorites.sort_order') ?? 0;

        $user->costCenterFavorites()->syncWithoutDetaching([
            $request->cost_center_id => ['sort_order' => $maxOrder + 1],
        ]);

        return response()->json(['message' => 'Favorite added.'], 201);
    }

    public function destroy(Request $request, int $costCenterId): JsonResponse
    {
        $request->user()->costCenterFavorites()->detach($costCenterId);

        return response()->json(['message' => 'Favorite removed.']);
    }

    public function reorder(Request $request): JsonResponse
    {
        $request->validate([
            'cost_center_ids' => ['required', 'array'],
            'cost_center_ids.*' => ['integer', 'exists:cost_centers,id'],
        ]);

        $user = $request->user();
        $existingFavoriteIds = $user->costCenterFavorites()->pluck('cost_centers.id')->all();
        $requestedIds = $request->cost_center_ids;

        sort($existingFavoriteIds);
        $sortedRequestedIds = $requestedIds;
        sort($sortedRequestedIds);

        if ($sortedRequestedIds !== $existingFavoriteIds) {
            return response()->json([
                'message' => 'Favorites reorder payload must match your existing favorites.',
            ], 422);
        }

        $syncData = [];
        foreach ($requestedIds as $index => $id) {
            $syncData[$id] = ['sort_order' => $index];
        }

        $user->costCenterFavorites()->sync($syncData);

        return response()->json(['message' => 'Favorites reordered.']);
    }
}
