#!/usr/bin/env bash
source "$(dirname "$0")/common.sh"

info "=== Running Hournest Tests ==="
echo ""

setup_php_tooling
check_command npm
check_command npx

# Backend tests
info "Running PHP backend tests..."
cd "$PROJECT_ROOT/backend"
if [ ! -d "vendor" ]; then
    run_composer install --no-interaction --quiet
fi
if [ ! -f ".env" ]; then
    cp "$PROJECT_ROOT/.env.example" .env
    run_php artisan key:generate --quiet
fi
if [ ! -f "database/database.sqlite" ]; then
    touch database/database.sqlite
fi
run_php artisan config:clear --quiet
run_php artisan test
echo ""

# Frontend unit tests
info "Running Angular frontend unit tests..."
cd "$PROJECT_ROOT/frontend"
if [ ! -d "node_modules" ]; then
    npm ci
fi
CHROME_BIN="${CHROME_BIN:-}"
if [ -z "$CHROME_BIN" ]; then
    for candidate in \
        "/c/Program Files/Google/Chrome/Application/chrome.exe" \
        "/c/Program Files (x86)/Google/Chrome/Application/chrome.exe" \
        "/mnt/c/Program Files/Google/Chrome/Application/chrome.exe" \
        "/mnt/c/Program Files (x86)/Google/Chrome/Application/chrome.exe"; do
        if [ -f "$candidate" ]; then
            CHROME_BIN="$candidate"
            export CHROME_BIN
            break
        fi
    done
fi
npx ng test --watch=false --browsers=ChromeHeadless --no-progress
echo ""

# Frontend build check
info "Verifying Angular frontend build..."
npx ng build --configuration=production 2>&1 | tail -5
echo ""

# Optional E2E smoke
if [ "${RUN_E2E_SMOKE:-false}" = "true" ]; then
    info "Running Playwright smoke suite..."
    npm run e2e:smoke
    echo ""
fi

ok "=== Backend tests, frontend unit tests, build checks, and optional smoke checks passed ==="
