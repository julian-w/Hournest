<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Console\Commands\Concerns\EnsuresSqliteDatabaseExists;
use App\Demo\DemoSafety;
use Illuminate\Console\Command;
use RuntimeException;

class RefreshDemoEnvironment extends Command
{
    use EnsuresSqliteDatabaseExists;

    protected $signature = 'hournest:demo:refresh
                            {--reference-date= : Override the configured demo reference date for this refresh run}
                            {--dataset-variant= : Override the configured demo dataset variant (for example: standard or full)}
                            {--force-demo : Allow refresh outside APP_ENV=demo and bypass the dedicated demo database guard}';

    protected $description = 'Refresh the database with deterministic, date-relative demo data.';

    public function handle(): int
    {
        $referenceDate = $this->option('reference-date');
        if (is_string($referenceDate) && trim($referenceDate) !== '') {
            config()->set('demo.reference_date', trim($referenceDate));
        }

        $datasetVariant = $this->option('dataset-variant');
        if (is_string($datasetVariant) && trim($datasetVariant) !== '') {
            config()->set('demo.dataset_variant', trim($datasetVariant));
        }

        try {
            app(DemoSafety::class)->assertRefreshAllowed(
                app()->environment(),
                (bool) $this->option('force-demo')
            );
        } catch (RuntimeException $exception) {
            $this->components->error($exception->getMessage());

            return self::FAILURE;
        }

        $this->ensureSqliteDatabaseExists();

        $this->call('migrate:fresh', [
            '--seed' => true,
            '--seeder' => 'Database\\Seeders\\DemoDatabaseSeeder',
            '--force' => true,
        ]);

        $this->components->info(sprintf(
            'Demo database refreshed using reference date %s (%s dataset).',
            (string) config('demo.reference_date'),
            (string) config('demo.dataset_variant', 'standard')
        ));

        return self::SUCCESS;
    }
}
