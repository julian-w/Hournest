<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('time_bookings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->date('date');
            $table->foreignId('cost_center_id')->constrained()->onDelete('restrict');
            $table->integer('percentage');
            $table->text('comment')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'date', 'cost_center_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('time_bookings');
    }
};
