<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Resources\CostCenterResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CostCenterController extends Controller
{
    /**
     * Get cost centers available to the authenticated user.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $costCenters = $request->user()->availableCostCenters();

        return CostCenterResource::collection($costCenters);
    }
}
