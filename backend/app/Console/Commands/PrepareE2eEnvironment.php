<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Console\Commands\Concerns\EnsuresSqliteDatabaseExists;
use Illuminate\Console\Command;

class PrepareE2eEnvironment extends Command
{
    use EnsuresSqliteDatabaseExists;

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
}
