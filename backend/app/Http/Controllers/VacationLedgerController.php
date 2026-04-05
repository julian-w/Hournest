<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\StoreVacationLedgerEntryRequest;
use App\Http\Resources\VacationLedgerEntryResource;
use App\Models\User;
use App\Models\VacationLedgerEntry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class VacationLedgerController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $year = (int) $request->query('year', (string) date('Y'));

        $entries = $request->user()
            ->ledgerEntries()
            ->where('year', $year)
            ->orderByDesc('created_at')
            ->get();

        return VacationLedgerEntryResource::collection($entries);
    }

    public function adminIndex(Request $request, User $user): AnonymousResourceCollection
    {
        $year = (int) $request->query('year', (string) date('Y'));

        $entries = $user->ledgerEntries()
            ->where('year', $year)
            ->orderByDesc('created_at')
            ->get();

        return VacationLedgerEntryResource::collection($entries);
    }

    public function store(StoreVacationLedgerEntryRequest $request, User $user): JsonResponse
    {
        $entry = $user->ledgerEntries()->create([
            'year' => $request->validated()['year'] ?? (int) date('Y'),
            'type' => $request->validated()['type'],
            'days' => $request->validated()['days'],
            'comment' => $request->validated()['comment'],
        ]);

        return response()->json([
            'data' => new VacationLedgerEntryResource($entry),
            'message' => 'Ledger entry created.',
        ], 201);
    }

    public function destroy(User $user, VacationLedgerEntry $entry): JsonResponse
    {
        abort_unless($entry->user_id === $user->id, 404);

        if ($entry->vacation_id !== null || $entry->blackout_period_id !== null) {
            return response()->json([
                'message' => 'Automatically created ledger entries cannot be deleted manually.',
            ], 422);
        }

        $entry->delete();

        return response()->json(['message' => 'Ledger entry deleted.']);
    }
}
