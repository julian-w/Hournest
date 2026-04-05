<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vacation_ledger_entries', function (Blueprint $table): void {
            $table->foreignId('blackout_period_id')
                ->nullable()
                ->after('vacation_id')
                ->constrained('blackout_periods')
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('vacation_ledger_entries', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('blackout_period_id');
        });
    }
};
