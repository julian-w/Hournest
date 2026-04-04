<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('time_booking_template_items', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('time_booking_template_id')->constrained()->cascadeOnDelete();
            $table->foreignId('cost_center_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('percentage');
            $table->timestamps();

            $table->unique(['time_booking_template_id', 'cost_center_id'], 'template_items_unique_cost_center');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('time_booking_template_items');
    }
};
