<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\StoreUserGroupRequest;
use App\Http\Resources\UserGroupResource;
use App\Models\UserGroup;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class UserGroupController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $groups = UserGroup::withCount(['members', 'costCenters'])
            ->with(['members', 'costCenters'])
            ->orderBy('name')
            ->get();

        return UserGroupResource::collection($groups);
    }

    public function store(StoreUserGroupRequest $request): JsonResponse
    {
        $group = UserGroup::create($request->validated());

        return response()->json([
            'data' => new UserGroupResource($group->load(['members', 'costCenters'])),
            'message' => 'User group created.',
        ], 201);
    }

    public function update(StoreUserGroupRequest $request, UserGroup $userGroup): JsonResponse
    {
        $userGroup->update($request->validated());

        return response()->json([
            'data' => new UserGroupResource($userGroup->load(['members', 'costCenters'])),
            'message' => 'User group updated.',
        ]);
    }

    public function destroy(UserGroup $userGroup): JsonResponse
    {
        $userGroup->delete();

        return response()->json(['message' => 'User group deleted.']);
    }

    public function setMembers(Request $request, UserGroup $userGroup): JsonResponse
    {
        $request->validate([
            'user_ids' => ['required', 'array'],
            'user_ids.*' => ['integer', 'exists:users,id'],
        ]);

        $userGroup->members()->sync($request->user_ids);

        return response()->json([
            'data' => new UserGroupResource($userGroup->load(['members', 'costCenters'])),
            'message' => 'Group members updated.',
        ]);
    }

    public function setCostCenters(Request $request, UserGroup $userGroup): JsonResponse
    {
        $request->validate([
            'cost_center_ids' => ['required', 'array'],
            'cost_center_ids.*' => ['integer', 'exists:cost_centers,id'],
        ]);

        $userGroup->costCenters()->sync($request->cost_center_ids);

        return response()->json([
            'data' => new UserGroupResource($userGroup->load(['members', 'costCenters'])),
            'message' => 'Group cost centers updated.',
        ]);
    }
}
