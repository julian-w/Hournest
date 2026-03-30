<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->renameColumn('synology_id', 'oidc_id');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->string('oidc_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('oidc_id')->nullable(false)->change();
        });

        Schema::table('users', function (Blueprint $table) {
            $table->renameColumn('oidc_id', 'synology_id');
        });
    }
};
