<?php

declare(strict_types=1);

namespace App\System;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use RuntimeException;

class SchemaCompatibilityGuard
{
    public function assertNoDowngradeRisk(): void
    {
        if ($this->allowsSchemaDowngrade()) {
            return;
        }

        $migrationTable = $this->migrationTableName();
        if ($migrationTable === '') {
            return;
        }

        try {
            if (!Schema::hasTable($migrationTable)) {
                return;
            }

            $appliedMigrations = DB::table($migrationTable)
                ->orderBy('id')
                ->pluck('migration')
                ->filter(static fn ($migration): bool => is_string($migration) && trim($migration) !== '')
                ->map(static fn (string $migration): string => trim($migration))
                ->values()
                ->all();
        } catch (\Throwable) {
            // Installation and broken DB connections are handled elsewhere; the downgrade guard only adds
            // protection when we can safely inspect the migration repository.
            return;
        }

        if ($appliedMigrations === []) {
            return;
        }

        $knownMigrations = $this->knownMigrationNames();
        if ($knownMigrations === []) {
            return;
        }

        $unknownAppliedMigrations = array_values(array_diff($appliedMigrations, $knownMigrations));
        if ($unknownAppliedMigrations === []) {
            return;
        }

        throw new RuntimeException(sprintf(
            'Database schema is newer than this application package. Downgrades are blocked because the database already contains migrations that are not present in the current code: %s. Deploy the same or a newer package instead.%s',
            implode(', ', $unknownAppliedMigrations),
            $this->allowsEmergencyOverrideMessage()
        ));
    }

    /**
     * @return array<int, string>
     */
    public function knownMigrationNames(): array
    {
        $files = glob(database_path('migrations/*.php')) ?: [];

        $migrations = array_map(
            static fn (string $file): string => pathinfo($file, PATHINFO_FILENAME),
            $files
        );

        sort($migrations);

        return $migrations;
    }

    private function migrationTableName(): string
    {
        $migrationsConfig = config('database.migrations');

        if (is_array($migrationsConfig)) {
            $table = $migrationsConfig['table'] ?? 'migrations';

            return is_string($table) ? trim($table) : 'migrations';
        }

        return is_string($migrationsConfig) && trim($migrationsConfig) !== ''
            ? trim($migrationsConfig)
            : 'migrations';
    }

    private function allowsSchemaDowngrade(): bool
    {
        return (bool) config('app.allow_schema_downgrade', false);
    }

    private function allowsEmergencyOverrideMessage(): string
    {
        return ' Set APP_ALLOW_SCHEMA_DOWNGRADE=true only for a deliberate emergency override after you verified schema compatibility.';
    }
}
