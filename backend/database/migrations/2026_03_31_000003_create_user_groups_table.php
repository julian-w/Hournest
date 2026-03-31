<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_groups', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('user_group_members', function (Blueprint $table) {
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_group_id')->constrained()->onDelete('cascade');
            $table->primary(['user_id', 'user_group_id']);
        });

        Schema::create('user_group_cost_centers', function (Blueprint $table) {
            $table->foreignId('user_group_id')->constrained()->onDelete('cascade');
            $table->foreignId('cost_center_id')->constrained()->onDelete('cascade');
            $table->primary(['user_group_id', 'cost_center_id']);
        });

        Schema::create('user_cost_centers', function (Blueprint $table) {
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('cost_center_id')->constrained()->onDelete('cascade');
            $table->primary(['user_id', 'cost_center_id']);
        });

        Schema::create('cost_center_favorites', function (Blueprint $table) {
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('cost_center_id')->constrained()->onDelete('cascade');
            $table->integer('sort_order')->default(0);
            $table->primary(['user_id', 'cost_center_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cost_center_favorites');
        Schema::dropIfExists('user_cost_centers');
        Schema::dropIfExists('user_group_cost_centers');
        Schema::dropIfExists('user_group_members');
        Schema::dropIfExists('user_groups');
    }
};
