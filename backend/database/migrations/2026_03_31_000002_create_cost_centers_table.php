<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cost_centers', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->boolean('is_system')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        // Seed system cost centers
        $now = now()->toDateTimeString();
        DB::table('cost_centers')->insert([
            ['code' => 'VACATION', 'name' => 'Vacation', 'description' => 'Approved vacation days', 'is_system' => true, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now, 'deleted_at' => null],
            ['code' => 'ILLNESS', 'name' => 'Illness', 'description' => 'Sick days', 'is_system' => true, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now, 'deleted_at' => null],
            ['code' => 'SPECIAL_LEAVE', 'name' => 'Special Leave', 'description' => 'Special leave (bereavement, maternity, etc.)', 'is_system' => true, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now, 'deleted_at' => null],
            ['code' => 'HOLIDAY', 'name' => 'Holiday', 'description' => 'Public holidays', 'is_system' => true, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now, 'deleted_at' => null],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('cost_centers');
    }
};
