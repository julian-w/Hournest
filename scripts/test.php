<?php

declare(strict_types=1);

function line(string $message = ''): void
{
    echo $message . PHP_EOL;
}

function ok(string $message): void
{
    line('[OK] ' . $message);
}

function info(string $message): void
{
    line('[INFO] ' . $message);
}

function warn(string $message): void
{
    line('[WARN] ' . $message);
}

function failMessage(string $message): void
{
    line('[FAIL] ' . $message);
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

    throw new RuntimeException('Could not find Laravel application root.');
}

function detectPackageRoot(string $appRoot): string
{
    if (__DIR__ === $appRoot) {
        return $appRoot;
    }

    return dirname($appRoot);
}

function loadEnvConfig(string $packageRoot): ?array
{
    $envFile = $packageRoot . DIRECTORY_SEPARATOR . '.env';
    if (!file_exists($envFile)) {
        return null;
    }

    $config = parse_ini_file($envFile, false, INI_SCANNER_RAW);

    return is_array($config) ? $config : null;
}

function resolvePath(string $path, string $packageRoot): string
{
    if ($path === '') {
        return $path;
    }

    if (preg_match('~^([A-Za-z]:[\\\\/]|/)~', $path)) {
        return $path;
    }

    return $packageRoot . DIRECTORY_SEPARATOR . $path;
}

function isBcryptHash(string $value): bool
{
    $info = password_get_info($value);

    return ($info['algoName'] ?? '') === 'bcrypt';
}

function checkPdoConnection(array $config, string $packageRoot, array &$failures, array &$warnings): void
{
    $connection = $config['DB_CONNECTION'] ?? 'sqlite';

    try {
        if ($connection === 'sqlite') {
            $dbPath = trim((string) ($config['DB_DATABASE'] ?? ''));
            if ($dbPath === '') {
                $failures[] = 'DB_DATABASE is empty for sqlite.';
                return;
            }

            $resolvedPath = resolvePath($dbPath, $packageRoot);
            if (!file_exists($resolvedPath)) {
                $warnings[] = 'SQLite database file does not exist yet: ' . $resolvedPath . ' (install.php can create it).';
                return;
            }

            new PDO('sqlite:' . $resolvedPath);
            ok('Database connection successful (sqlite).');
            return;
        }

        if ($connection === 'mysql') {
            $host = trim((string) ($config['DB_HOST'] ?? ''));
            $port = trim((string) ($config['DB_PORT'] ?? '3306'));
            $database = trim((string) ($config['DB_DATABASE'] ?? ''));
            $username = trim((string) ($config['DB_USERNAME'] ?? ''));
            $password = (string) ($config['DB_PASSWORD'] ?? '');

            if ($host === '' || $database === '' || $username === '') {
                $failures[] = 'DB_HOST, DB_DATABASE, and DB_USERNAME must be set for mysql.';
                return;
            }

            $pdo = new PDO(
                sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4', $host, $port, $database),
                $username,
                $password,
                [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_TIMEOUT => 5]
            );
            $pdo->query('SELECT 1');
            ok('Database connection successful (mysql).');
            return;
        }

        if ($connection === 'pgsql') {
            $host = trim((string) ($config['DB_HOST'] ?? ''));
            $port = trim((string) ($config['DB_PORT'] ?? '5432'));
            $database = trim((string) ($config['DB_DATABASE'] ?? ''));
            $username = trim((string) ($config['DB_USERNAME'] ?? ''));
            $password = (string) ($config['DB_PASSWORD'] ?? '');

            if ($host === '' || $database === '' || $username === '') {
                $failures[] = 'DB_HOST, DB_DATABASE, and DB_USERNAME must be set for pgsql.';
                return;
            }

            $pdo = new PDO(
                sprintf('pgsql:host=%s;port=%s;dbname=%s', $host, $port, $database),
                $username,
                $password,
                [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_TIMEOUT => 5]
            );
            $pdo->query('SELECT 1');
            ok('Database connection successful (pgsql).');
            return;
        }

        $warnings[] = 'Database connection check skipped for unsupported DB_CONNECTION=' . $connection . '.';
    } catch (Throwable $e) {
        $failures[] = 'Database connection failed: ' . $e->getMessage();
    }
}

function checkWritable(string $path, string $label, array &$failures): void
{
    if (!file_exists($path)) {
        $failures[] = $label . ' does not exist: ' . $path;
        return;
    }

    if (!is_writable($path)) {
        $failures[] = $label . ' is not writable: ' . $path;
        return;
    }

    ok($label . ' is writable.');
}

$failures = [];
$warnings = [];

try {
    $appRoot = detectAppRoot();
    $packageRoot = detectPackageRoot($appRoot);
} catch (RuntimeException $e) {
    failMessage($e->getMessage());
    exit(1);
}

line('============================================');
line('  Hournest -- Environment Test');
line('============================================');
line('');

info('App root: ' . $appRoot);
info('Package root: ' . $packageRoot);

if (PHP_VERSION_ID >= 80500) {
    ok('PHP version is compatible: ' . PHP_VERSION);
} else {
    $failures[] = 'PHP 8.5+ is required. Current version: ' . PHP_VERSION;
}

$config = loadEnvConfig($packageRoot);
if ($config === null) {
    $warnings[] = 'No .env found in package root. Create it from .env.example before installation.';
} else {
    ok('.env file found.');
}

$databaseConnection = $config['DB_CONNECTION'] ?? 'sqlite';
$requiredExtensions = ['mbstring', 'openssl', 'tokenizer', 'xml', 'curl', 'fileinfo'];

if ($databaseConnection === 'mysql') {
    $requiredExtensions[] = 'pdo_mysql';
} elseif ($databaseConnection === 'pgsql') {
    $requiredExtensions[] = 'pdo_pgsql';
} else {
    $requiredExtensions[] = 'pdo_sqlite';
}

foreach ($requiredExtensions as $extension) {
    if (extension_loaded($extension)) {
        ok('PHP extension loaded: ' . $extension);
    } else {
        $failures[] = 'Missing PHP extension: ' . $extension;
    }
}

if (file_exists($appRoot . DIRECTORY_SEPARATOR . 'artisan')) {
    ok('Laravel application found.');
} else {
    $failures[] = 'artisan file not found.';
}

if (is_dir($appRoot . DIRECTORY_SEPARATOR . 'vendor')) {
    ok('vendor/ directory found.');
} else {
    $warnings[] = 'vendor/ directory is missing. install.php will require Composer in this case.';
}

if (file_exists($appRoot . DIRECTORY_SEPARATOR . 'public' . DIRECTORY_SEPARATOR . 'index.php')) {
    ok('public/index.php found.');
} else {
    $failures[] = 'public/index.php is missing.';
}

if ($config !== null) {
    $superadminUsername = trim((string) ($config['SUPERADMIN_USERNAME'] ?? ''));
    $superadminPassword = trim((string) ($config['SUPERADMIN_PASSWORD'] ?? ''));
    $placeholderHashes = [
        '$2y$12$replace-with-bcrypt-hash',
        '$2y$12$...',
    ];

    if ($superadminUsername === '') {
        $failures[] = 'SUPERADMIN_USERNAME is empty.';
    } else {
        ok('SUPERADMIN_USERNAME is set.');
    }

    if ($superadminPassword === '') {
        $failures[] = 'SUPERADMIN_PASSWORD is empty.';
    } elseif (in_array($superadminPassword, $placeholderHashes, true) || !isBcryptHash($superadminPassword)) {
        $failures[] = 'SUPERADMIN_PASSWORD is not a valid bcrypt hash.';
    } else {
        ok('SUPERADMIN_PASSWORD contains a valid bcrypt hash.');
    }

    $appDebug = strtolower(trim((string) ($config['APP_DEBUG'] ?? '')));
    $appEnv = strtolower(trim((string) ($config['APP_ENV'] ?? '')));
    if ($appEnv === 'production' && in_array($appDebug, ['1', 'true', 'yes', 'on'], true)) {
        $warnings[] = 'APP_DEBUG is enabled while APP_ENV=production.';
    }

    checkPdoConnection($config, $packageRoot, $failures, $warnings);
} else {
    info('Skipping .env-based checks until a .env file exists.');
}

checkWritable($appRoot . DIRECTORY_SEPARATOR . 'storage', 'storage/', $failures);
checkWritable($appRoot . DIRECTORY_SEPARATOR . 'bootstrap' . DIRECTORY_SEPARATOR . 'cache', 'bootstrap/cache', $failures);

line('');

foreach ($warnings as $warning) {
    warn($warning);
}

foreach ($failures as $failure) {
    failMessage($failure);
}

line('');

if ($failures === []) {
    ok('Environment check completed successfully.');
    exit(0);
}

failMessage('Environment check completed with failures.');
exit(1);
