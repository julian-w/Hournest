<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\StoreTimeBookingTemplateRequest;
use App\Http\Requests\UpdateTimeBookingTemplateRequest;
use App\Http\Resources\TimeBookingTemplateResource;
use App\Models\TimeBookingTemplate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class TimeBookingTemplateController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $templates = $request->user()
            ->timeBookingTemplates()
            ->with('items.costCenter')
            ->orderBy('name')
            ->get();

        return TimeBookingTemplateResource::collection($templates);
    }

    public function store(StoreTimeBookingTemplateRequest $request): JsonResponse
    {
        $user = $request->user();
        $items = $request->validated('items');

        if ($response = $this->validateTemplateCostCenters($user, $items)) {
            return $response;
        }

        $template = DB::transaction(function () use ($request, $user, $items): TimeBookingTemplate {
            $template = $user->timeBookingTemplates()->create([
                'name' => $request->validated('name'),
            ]);

            $template->items()->createMany($items);

            return $template->load('items.costCenter');
        });

        return response()->json([
            'data' => new TimeBookingTemplateResource($template),
            'message' => 'Template created.',
        ], 201);
    }

    public function update(UpdateTimeBookingTemplateRequest $request, TimeBookingTemplate $timeBookingTemplate): JsonResponse
    {
        if ($timeBookingTemplate->user_id !== $request->user()->id) {
            abort(404);
        }

        $items = $request->validated('items');
        if ($response = $this->validateTemplateCostCenters($request->user(), $items)) {
            return $response;
        }

        DB::transaction(function () use ($request, $timeBookingTemplate, $items): void {
            $timeBookingTemplate->update([
                'name' => $request->validated('name'),
            ]);

            $timeBookingTemplate->items()->delete();
            $timeBookingTemplate->items()->createMany($items);
        });

        $timeBookingTemplate->load('items.costCenter');

        return response()->json([
            'data' => new TimeBookingTemplateResource($timeBookingTemplate),
            'message' => 'Template updated.',
        ]);
    }

    public function destroy(Request $request, TimeBookingTemplate $timeBookingTemplate): JsonResponse
    {
        if ($timeBookingTemplate->user_id !== $request->user()->id) {
            abort(404);
        }

        $timeBookingTemplate->delete();

        return response()->json(['message' => 'Template deleted.']);
    }

    private function validateTemplateCostCenters($user, array $items): ?JsonResponse
    {
        $available = $user->availableCostCenters()->keyBy('id');

        foreach ($items as $item) {
            $costCenter = $available->get((int) $item['cost_center_id']);

            if ($costCenter === null) {
                return response()->json(['message' => 'Cost center not available.'], 422);
            }

            if ($costCenter->is_system) {
                return response()->json(['message' => 'System cost centers cannot be saved in templates.'], 422);
            }
        }

        return null;
    }
}
