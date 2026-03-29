<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\UpdateSettingsRequest;
use App\Http\Resources\SettingResource;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class SettingController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $settings = Setting::all();

        return SettingResource::collection($settings);
    }

    public function update(UpdateSettingsRequest $request): JsonResponse
    {
        $settings = $request->validated()['settings'];

        foreach ($settings as $key => $value) {
            Setting::set($key, $value);
        }

        return response()->json([
            'data' => SettingResource::collection(Setting::all()),
            'message' => 'Settings updated.',
        ]);
    }
}
