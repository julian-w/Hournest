<?php

declare(strict_types=1);

function out(string $message): void
{
    echo $message . PHP_EOL;
}

function ok(string $message): void
{
    out('[OK] ' . $message);
}

function info(string $message): void
{
    out('[INFO] ' . $message);
}

function warn(string $message): void
{
    out('[WARN] ' . $message);
}

function fail(string $message, int $exitCode = 1): never
{
    $line = '[ERROR] ' . $message . PHP_EOL;
    if (defined('STDERR')) {
        fwrite(STDERR, $line);
    } else {
        echo $line;
    }
    exit($exitCode);
}

function commandExists(string $command): bool
{
    $checker = DIRECTORY_SEPARATOR === '\\' ? 'where' : 'command -v';
    $result = shell_exec($checker . ' ' . escapeshellarg($command) . ' 2>/dev/null');

    return is_string($result) && trim($result) !== '';
}

function runCommand(string $command, string $workingDirectory): void
{
    info('Running: ' . $command);
    $fullCommand = 'cd ' . escapeshellarg($workingDirectory) . ' && ' . $command . ' 2>&1';
    $output = [];
    $exitCode = 0;
    exec($fullCommand, $output, $exitCode);

    foreach ($output as $line) {
        out($line);
    }

    if ($exitCode !== 0) {
        fail('Command failed with exit code ' . $exitCode . ': ' . $command, $exitCode);
    }
}

function detectAppRoot(): string
{
    $selfDir = __DIR__;

    if (file_exists($selfDir . DIRECTORY_SEPARATOR . 'artisan')) {
        return $selfDir;
    }

    $repoBackend = dirname($selfDir) . DIRECTORY_SEPARATOR . 'backend';
    if (file_exists($repoBackend . DIRECTORY_SEPARATOR . 'artisan')) {
        return $repoBackend;
    }

    fail('Could not find Laravel application root.');
}

function detectPackageRoot(string $appRoot): string
{
    if (file_exists($appRoot . DIRECTORY_SEPARATOR . 'artisan') && __DIR__ === $appRoot) {
        return $appRoot;
    }

    return dirname($appRoot);
}

function ensureDirectories(string $appRoot): void
{
    $directories = [
        $appRoot . '/bootstrap/cache',
        $appRoot . '/storage/logs',
        $appRoot . '/storage/framework/cache',
        $appRoot . '/storage/framework/sessions',
        $appRoot . '/storage/framework/views',
    ];

    foreach ($directories as $directory) {
        if (!is_dir($directory) && !mkdir($directory, 0775, true) && !is_dir($directory)) {
            fail('Could not create directory: ' . $directory);
        }
    }
}

function createEnvIfMissing(string $packageRoot): bool
{
    $envFile = $packageRoot . '/.env';
    $envExample = $packageRoot . '/.env.example';

    if (file_exists($envFile)) {
        return false;
    }

    if (!file_exists($envExample)) {
        fail('No .env.example found.');
    }

    if (!copy($envExample, $envFile)) {
        fail('Could not create .env from .env.example');
    }

    ok('Created .env from .env.example');
    warn('Please edit .env now and run php install.php again.');

    return true;
}

function createSqliteDatabaseIfNeeded(string $appRoot, string $packageRoot): void
{
    $config = loadEnvConfig($packageRoot);

    if (!is_array($config)) {
        warn('Could not parse .env, skipping SQLite auto-create.');
        return;
    }

    $connection = $config['DB_CONNECTION'] ?? 'sqlite';
    if ($connection !== 'sqlite') {
        return;
    }

    $dbPath = $config['DB_DATABASE'] ?? '';
    if ($dbPath === '') {
        return;
    }

    if (!preg_match('~^([A-Za-z]:[\\\\/]|/)~', $dbPath)) {
        $dbPath = $packageRoot . DIRECTORY_SEPARATOR . $dbPath;
    }

    $dbDir = dirname($dbPath);
    if (!is_dir($dbDir) && !mkdir($dbDir, 0775, true) && !is_dir($dbDir)) {
        fail('Could not create SQLite directory: ' . $dbDir);
    }

    if (!file_exists($dbPath) && !touch($dbPath)) {
        fail('Could not create SQLite database: ' . $dbPath);
    }

    ok('SQLite database ready: ' . $dbPath);
}

function loadEnvConfig(string $packageRoot): ?array
{
    $envFile = $packageRoot . '/.env';
    $config = parse_ini_file($envFile, false, INI_SCANNER_RAW);

    return is_array($config) ? $config : null;
}

$arguments = $_SERVER['argv'] ?? [];
$seed = in_array('--seed', $arguments, true);
$appRoot = detectAppRoot();
$packageRoot = detectPackageRoot($appRoot);
$phpBinary = escapeshellarg(PHP_BINARY);

info('============================================');
info('  Hournest -- PHP Installer');
info('============================================');
out('');

ensureDirectories($appRoot);

if (createEnvIfMissing($packageRoot)) {
    exit(0);
}

if (PHP_VERSION_ID < 80500) {
    fail('PHP 8.5+ is required. Current version: ' . PHP_VERSION);
}

$config = loadEnvConfig($packageRoot);
$databaseConnection = $config['DB_CONNECTION'] ?? 'sqlite';
$requiredExtensions = ['mbstring', 'openssl', 'tokenizer', 'xml', 'curl', 'fileinfo'];

if ($databaseConnection === 'mysql') {
    $requiredExtensions[] = 'pdo_mysql';
} elseif ($databaseConnection === 'pgsql') {
    $requiredExtensions[] = 'pdo_pgsql';
} else {
    $requiredExtensions[] = 'pdo_sqlite';
}

$missingExtensions = array_values(array_filter(
    $requiredExtensions,
    static fn (string $extension): bool => !extension_loaded($extension)
));

if ($missingExtensions !== []) {
    fail('Missing PHP extensions: ' . implode(', ', $missingExtensions));
}

if (!is_dir($appRoot . '/vendor')) {
    if (!commandExists('composer')) {
        fail('Composer is only required when vendor/ is missing. The release package should already include vendor/.');
    }

    runCommand('composer install --no-dev --optimize-autoloader --no-interaction', $appRoot);
}

runCommand($phpBinary . ' artisan key:generate --force', $appRoot);
createSqliteDatabaseIfNeeded($appRoot, $packageRoot);
runCommand($phpBinary . ' artisan migrate --force', $appRoot);

if ($seed) {
    runCommand($phpBinary . ' artisan db:seed --force', $appRoot);
}

runCommand($phpBinary . ' artisan config:cache', $appRoot);
runCommand($phpBinary . ' artisan route:cache', $appRoot);
runCommand($phpBinary . ' artisan view:cache', $appRoot);

@chmod($appRoot . '/storage', 0775);
@chmod($appRoot . '/bootstrap/cache', 0775);

out('');
ok('Installation complete.');
info('Document root: ' . $packageRoot . '/public');
info('If needed, open public/superadmin-password-helper.php once and delete it afterwards.');
