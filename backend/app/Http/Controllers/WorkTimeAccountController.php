<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\StoreWorkTimeAccountEntryRequest;
use App\Http\Resources\WorkTimeAccountEntryResource;
use App\Models\User;
use App\Models\WorkTimeAccountEntry;
use App\Services\WorkTimeAccountLedgerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class WorkTimeAccountController extends Controller
{
    public function __construct(private readonly WorkTimeAccountLedgerService $ledgerService)
    {
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        $year = (int) $request->query('year', (string) date('Y'));
        $rows = $this->ledgerService->buildForYear($request->user(), $year);

        return WorkTimeAccountEntryResource::collection($rows);
    }

    public function adminIndex(Request $request, User $user): AnonymousResourceCollection
    {
        $year = (int) $request->query('year', (string) date('Y'));
        $rows = $this->ledgerService->buildForYear($user, $year);

        return WorkTimeAccountEntryResource::collection($rows);
    }

    public function store(StoreWorkTimeAccountEntryRequest $request, User $user): JsonResponse
    {
        $entry = $user->workTimeAccountEntries()->create([
            'effective_date' => $request->validated()['effective_date'],
            'type' => $request->validated()['type'],
            'minutes_delta' => $request->validated()['minutes_delta'],
            'comment' => $request->validated()['comment'],
            'created_by' => $request->user()?->id,
        ]);

        return response()->json([
            'data' => new WorkTimeAccountEntryResource([
                'id' => $entry->id,
                'user_id' => $entry->user_id,
                'effective_date' => $entry->effective_date,
                'type' => $entry->type,
                'minutes_delta' => $entry->minutes_delta,
                'balance_after' => 0,
                'comment' => $entry->comment,
                'created_at' => $entry->created_at,
                'created_by' => $entry->created_by,
                'created_by_name' => $request->user()?->display_name,
                'source_type' => 'manual',
                'source_id' => $entry->id,
            ]),
            'message' => 'Work time account entry created.',
        ], 201);
    }

    public function destroy(User $user, WorkTimeAccountEntry $entry): JsonResponse
    {
        abort_unless($entry->user_id === $user->id, 404);

        $entry->delete();

        return response()->json(['message' => 'Work time account entry deleted.']);
    }
}
