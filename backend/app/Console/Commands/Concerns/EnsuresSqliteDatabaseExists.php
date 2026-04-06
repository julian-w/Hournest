<?php

declare(strict_types=1);

namespace App\Console\Commands\Concerns;

trait EnsuresSqliteDatabaseExists
{
    protected function ensureSqliteDatabaseExists(): void
    {
        if (config('database.default') !== 'sqlite') {
            return;
        }

        $databasePath = config('database.connections.sqlite.database');
        if (!is_string($databasePath) || $databasePath === '' || $databasePath === ':memory:') {
            return;
        }

        $directory = dirname($databasePath);
        if (!is_dir($directory)) {
            mkdir($directory, 0777, true);
        }

        if (!file_exists($databasePath)) {
            touch($databasePath);
        }
    }
}
