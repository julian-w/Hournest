<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Enums\LedgerEntryType;
use App\Models\Setting;
use App\Models\User;
use App\Models\VacationLedgerEntry;
use Carbon\Carbon;
use Illuminate\Console\Command;

class YearlyMaintenance extends Command
{
    protected $signature = 'hournest:yearly-maintenance
                            {--year= : The year to process (defaults to current year)}
                            {--dry-run : Show what would be done without making changes}';

    protected $description = 'Run yearly maintenance: book entitlements, carryover from previous year, and expire old carryover';

    public function handle(): int
    {
        $year = (int) ($this->option('year') ?? date('Y'));
        $dryRun = (bool) $this->option('dry-run');
        $previousYear = $year - 1;

        if ($dryRun) {
            $this->info("DRY RUN -- no changes will be made.\n");
        }

        $this->info("Processing yearly maintenance for {$year}...\n");

        $users = User::all();
        $stats = ['entitlements' => 0, 'carryovers' => 0, 'expired' => 0, 'skipped' => 0];

        foreach ($users as $user) {
            $this->line("  {$user->display_name} ({$user->email}):");

            // 1. Book annual entitlement
            $this->bookEntitlement($user, $year, $dryRun, $stats);

            // 2. Book carryover from previous year
            $this->bookCarryover($user, $year, $previousYear, $dryRun, $stats);

            // 3. Expire old carryover if configured
            $this->expireCarryover($user, $year, $dryRun, $stats);
        }

        $this->newLine();
        $this->info("Done. Entitlements: {$stats['entitlements']}, Carryovers: {$stats['carryovers']}, Expired: {$stats['expired']}, Skipped: {$stats['skipped']}");

        return self::SUCCESS;
    }

    private function bookEntitlement(User $user, int $year, bool $dryRun, array &$stats): void
    {
        $existing = VacationLedgerEntry::where('user_id', $user->id)
            ->where('year', $year)
            ->where('type', LedgerEntryType::Entitlement)
            ->exists();

        if ($existing) {
            $this->line("    Entitlement: already exists, skipping.");
            $stats['skipped']++;
            return;
        }

        $days = $user->vacation_days_per_year;
        $this->line("    Entitlement: +{$days} days");

        if (!$dryRun) {
            VacationLedgerEntry::create([
                'user_id' => $user->id,
                'year' => $year,
                'type' => LedgerEntryType::Entitlement,
                'days' => $days,
                'comment' => "Annual vacation entitlement for {$year}",
            ]);
        }

        $stats['entitlements']++;
    }

    private function bookCarryover(User $user, int $year, int $previousYear, bool $dryRun, array &$stats): void
    {
        $carryoverEnabled = Setting::get('carryover_enabled', 'true');
        if ($carryoverEnabled === 'false' || $carryoverEnabled === false) {
            $this->line("    Carryover: disabled in settings, skipping.");
            return;
        }

        $existing = VacationLedgerEntry::where('user_id', $user->id)
            ->where('year', $year)
            ->where('type', LedgerEntryType::Carryover)
            ->exists();

        if ($existing) {
            $this->line("    Carryover: already exists, skipping.");
            $stats['skipped']++;
            return;
        }

        // Calculate remaining days from previous year
        $remaining = $user->remainingVacationDays($previousYear);

        if ($remaining <= 0) {
            $this->line("    Carryover: no remaining days from {$previousYear}.");
            return;
        }

        $this->line("    Carryover: +{$remaining} days from {$previousYear}");

        if (!$dryRun) {
            VacationLedgerEntry::create([
                'user_id' => $user->id,
                'year' => $year,
                'type' => LedgerEntryType::Carryover,
                'days' => $remaining,
                'comment' => "Carried over from {$previousYear}",
            ]);
        }

        $stats['carryovers']++;
    }

    private function expireCarryover(User $user, int $year, bool $dryRun, array &$stats): void
    {
        $expiryDate = Setting::get('carryover_expiry_date');
        if (!$expiryDate) {
            return;
        }

        // Parse DD.MM format
        $parts = explode('.', (string) $expiryDate);
        if (count($parts) !== 2) {
            return;
        }

        $expiry = Carbon::createFromFormat('Y-m-d', "{$year}-{$parts[1]}-{$parts[0]}");
        if (!$expiry || Carbon::today()->lt($expiry)) {
            return; // Not yet expired
        }

        // Check if already expired this year
        $existing = VacationLedgerEntry::where('user_id', $user->id)
            ->where('year', $year)
            ->where('type', LedgerEntryType::Expired)
            ->exists();

        if ($existing) {
            $this->line("    Expiry: already processed, skipping.");
            $stats['skipped']++;
            return;
        }

        // Find carryover entry for this year
        $carryover = VacationLedgerEntry::where('user_id', $user->id)
            ->where('year', $year)
            ->where('type', LedgerEntryType::Carryover)
            ->first();

        if (!$carryover || $carryover->days <= 0) {
            return;
        }

        $this->line("    Expiry: -{$carryover->days} days (carryover expired on {$expiryDate})");

        if (!$dryRun) {
            VacationLedgerEntry::create([
                'user_id' => $user->id,
                'year' => $year,
                'type' => LedgerEntryType::Expired,
                'days' => -$carryover->days,
                'comment' => "Carryover expired on {$expiryDate}",
            ]);
        }

        $stats['expired']++;
    }
}
