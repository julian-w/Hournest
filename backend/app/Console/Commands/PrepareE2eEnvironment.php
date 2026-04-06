<?php

declare(strict_types=1);

namespace App\Console\Commands;

use Illuminate\Console\Command;

class PrepareE2eEnvironment extends Command
{
    protected $signature = 'hournest:e2e-prepare';

    protected $description = 'Prepare a deterministic local database for Playwright E2E tests.';

    public function handle(): int
    {
        $this->ensureSqliteDatabaseExists();

        $this->call('migrate:fresh', [
            '--seed' => true,
            '--force' => true,
        ]);

        $this->components->info('Deterministic E2E database prepared.');

        return self::SUCCESS;
    }

    private function ensureSqliteDatabaseExists(): void
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
