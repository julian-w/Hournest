#!/usr/bin/env bash
set -euo pipefail

APP_ROOT="/var/www/html"
RUNTIME_ROOT="/var/lib/hournest"
RUNTIME_ENV_DIR="${RUNTIME_ROOT}/env"
PERSISTENT_ENV_FILE="${RUNTIME_ENV_DIR}/.env"
DATABASE_ROOT="${RUNTIME_ROOT}/database"

log() {
    printf '[hournest-entrypoint] %s\n' "$*"
}

is_true() {
    case "${1:-}" in
        1|true|TRUE|yes|YES|on|ON)
            return 0
            ;;
        *)
            return 1
            ;;
    esac
}

cleanup() {
    set +e

    if [ -n "${apache_pid:-}" ] && kill -0 "${apache_pid}" 2>/dev/null; then
        kill -TERM "${apache_pid}" 2>/dev/null || true
    fi

    if [ -n "${scheduler_pid:-}" ] && kill -0 "${scheduler_pid}" 2>/dev/null; then
        kill -TERM "${scheduler_pid}" 2>/dev/null || true
    fi

    if [ -n "${apache_pid:-}" ] || [ -n "${scheduler_pid:-}" ]; then
        wait ${apache_pid:-} ${scheduler_pid:-} 2>/dev/null || true
    fi
}

env_file_get() {
    php -r '
        $config = @parse_ini_file($argv[1], false, INI_SCANNER_RAW);
        if (is_array($config) && array_key_exists($argv[2], $config)) {
            echo (string) $config[$argv[2]];
        }
    ' "$PERSISTENT_ENV_FILE" "$1"
}

env_file_set() {
    php -r '
        $file = $argv[1];
        $key = $argv[2];
        $value = $argv[3];
        $lines = file_exists($file) ? file($file, FILE_IGNORE_NEW_LINES) : [];
        $updated = false;

        foreach ($lines as &$line) {
            if (preg_match("/^" . preg_quote($key, "/") . "=/", $line) === 1) {
                $line = $key . "=" . $value;
                $updated = true;
            }
        }
        unset($line);

        if (!$updated) {
            $lines[] = $key . "=" . $value;
        }

        file_put_contents($file, implode(PHP_EOL, $lines) . PHP_EOL);
    ' "$PERSISTENT_ENV_FILE" "$1" "$2"
}

is_valid_bcrypt_hash() {
    [ "$(php -r '
        $info = password_get_info($argv[1]);
        echo (($info["algoName"] ?? "") === "bcrypt") ? "1" : "0";
    ' "$1")" = "1" ]
}

generate_random_password() {
    php -r '
        $alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
        $password = "";
        $max = strlen($alphabet) - 1;
        for ($i = 0; $i < 20; $i++) {
            $password .= $alphabet[random_int(0, $max)];
        }
        echo $password;
    '
}

generate_bcrypt_hash() {
    php -r 'echo password_hash($argv[1], PASSWORD_BCRYPT);' "$1"
}

ensure_persistent_env_file() {
    mkdir -p "${RUNTIME_ENV_DIR}"

    if [ ! -f "${PERSISTENT_ENV_FILE}" ]; then
        cp .env.example "${PERSISTENT_ENV_FILE}"
        log "Created persistent runtime env at ${PERSISTENT_ENV_FILE}."
    fi

    if [ -e .env ] && [ ! -L .env ]; then
        cp .env "${PERSISTENT_ENV_FILE}"
    fi

    ln -sfn "${PERSISTENT_ENV_FILE}" .env
}

bootstrap_app_key() {
    local file_key
    file_key="$(env_file_get APP_KEY)"

    if [ -n "${APP_KEY:-}" ] || [ -n "${file_key}" ]; then
        return
    fi

    # APP_KEY is a generated secret and may be written into the persistent runtime .env on first boot.
    log "Generating APP_KEY in persistent runtime env."
    php artisan key:generate --force --no-interaction
}

bootstrap_superadmin_credentials() {
    local configured_hash configured_username generated_password generated_hash

    configured_hash="${SUPERADMIN_PASSWORD:-$(env_file_get SUPERADMIN_PASSWORD)}"
    configured_username="${SUPERADMIN_USERNAME:-$(env_file_get SUPERADMIN_USERNAME)}"

    if [ -n "${configured_hash}" ] && is_valid_bcrypt_hash "${configured_hash}"; then
        return
    fi

    generated_password="$(generate_random_password)"
    generated_hash="$(generate_bcrypt_hash "${generated_password}")"

    if [ -z "${configured_username}" ]; then
        configured_username="superadmin"
    fi

    # Docker bootstrap is allowed to persist an initial superadmin hash, but only when none was configured.
    env_file_set SUPERADMIN_USERNAME "${configured_username}"
    env_file_set SUPERADMIN_PASSWORD "${generated_hash}"

    log "Generated initial superadmin credentials in ${PERSISTENT_ENV_FILE}."
    log "Initial superadmin username: ${configured_username}"
    log "Initial superadmin password: ${generated_password}"
    log "Change SUPERADMIN_PASSWORD later in ${PERSISTENT_ENV_FILE} or provide it via container environment."
}

cd "${APP_ROOT}"

mkdir -p \
    bootstrap/cache \
    storage/framework/cache \
    storage/framework/sessions \
    storage/framework/views \
    storage/logs \
    "${RUNTIME_ENV_DIR}" \
    "${DATABASE_ROOT}"

ensure_persistent_env_file

runtime_mode="${HOURNEST_RUNTIME_MODE:-app}"
case "${runtime_mode}" in
    app|demo)
        ;;
    *)
        log "Unsupported HOURNEST_RUNTIME_MODE=${runtime_mode}. Use app or demo."
        exit 1
        ;;
esac

if [ "${runtime_mode}" = "demo" ]; then
    export APP_ENV="demo"
    export DEMO_ENABLED="true"
    export AUTH_OAUTH_ENABLED="false"
    export DEMO_ALLOW_DEFAULT_PASSWORDS="${DEMO_ALLOW_DEFAULT_PASSWORDS:-false}"
    export DEMO_REQUIRE_DEDICATED_DATABASE="${DEMO_REQUIRE_DEDICATED_DATABASE:-true}"
    export DEMO_LOGIN_PASSWORD="${DEMO_LOGIN_PASSWORD:-public-demo-password}"
    export DEMO_NOTICE="${DEMO_NOTICE:-Public demo preview. Changes may be reset automatically and some admin actions are disabled.}"
    export DEMO_REFRESH_CRON="${DEMO_REFRESH_CRON:-*/30 * * * *}"
else
    export APP_ENV="${APP_ENV:-production}"
fi

export DB_CONNECTION="${DB_CONNECTION:-sqlite}"
if [ "${DB_CONNECTION}" = "sqlite" ] && [ -z "${DB_DATABASE:-}" ]; then
    if [ "${runtime_mode}" = "demo" ]; then
        export DB_DATABASE="${DATABASE_ROOT}/demo.sqlite"
    else
        export DB_DATABASE="${DATABASE_ROOT}/app.sqlite"
    fi
fi

if [ "${DB_CONNECTION}" = "sqlite" ] && [ "${DB_DATABASE:-}" != ":memory:" ] && [ -n "${DB_DATABASE:-}" ]; then
    mkdir -p "$(dirname "${DB_DATABASE}")"
    touch "${DB_DATABASE}"
fi

chown -R www-data:www-data storage bootstrap/cache "${RUNTIME_ROOT}"
if [ -f "${PERSISTENT_ENV_FILE}" ]; then
    chown www-data:www-data "${PERSISTENT_ENV_FILE}"
fi

bootstrap_app_key
bootstrap_superadmin_credentials

php artisan config:clear --no-interaction >/dev/null
php artisan route:clear --no-interaction >/dev/null
php artisan view:clear --no-interaction >/dev/null
php artisan cache:clear --no-interaction >/dev/null

if is_true "${HOURNEST_AUTO_MIGRATE:-true}"; then
    if [ "${runtime_mode}" = "demo" ] && is_true "${HOURNEST_DEMO_REFRESH_ON_BOOT:-true}"; then
        log "Refreshing demo dataset."
        php artisan hournest:demo:refresh --no-interaction
    else
        log "Running database migrations."
        php artisan migrate --force --no-interaction
    fi
fi

trap cleanup TERM INT QUIT

scheduler_pid=""
if is_true "${HOURNEST_ENABLE_SCHEDULER:-true}"; then
    log "Starting Laravel scheduler."
    php artisan schedule:work --no-interaction &
    scheduler_pid=$!
fi

log "Starting Apache."
apache2-foreground &
apache_pid=$!

if [ -n "${scheduler_pid}" ]; then
    wait -n "${apache_pid}" "${scheduler_pid}"
else
    wait "${apache_pid}"
fi

exit_code=$?
cleanup
exit "${exit_code}"
