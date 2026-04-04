<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vacations', function (Blueprint $table): void {
            $table->string('scope')->default('full_day')->after('end_date');
        });
    }

    public function down(): void
    {
        Schema::table('vacations', function (Blueprint $table): void {
            $table->dropColumn('scope');
        });
    }
};
