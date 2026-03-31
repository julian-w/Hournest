<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('time_locks', function (Blueprint $table) {
            $table->id();
            $table->integer('year');
            $table->integer('month');
            $table->foreignId('locked_by')->constrained('users')->onDelete('cascade');
            $table->timestamp('locked_at');
            $table->timestamps();

            $table->unique(['year', 'month']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('time_locks');
    }
};
