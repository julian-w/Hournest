#!/usr/bin/env bash
# Runs the same checks as the GitHub Actions release workflow -- locally.
# Use this to verify everything passes before tagging a release.

source "$(dirname "$0")/common.sh"

FAILED=0

info "============================================"
info "  Hournest CI -- Local Pipeline"
info "============================================"
echo ""

# --- 1. Backend Tests ---
info "[1/6] Running backend tests..."
cd "$PROJECT_ROOT/backend"

setup_php_tooling || { err "PHP tooling not found"; exit 1; }
mkdir -p bootstrap/cache storage/logs storage/framework/cache storage/framework/sessions storage/framework/views

if [ ! -d "vendor" ]; then
    info "Installing Composer dependencies..."
    run_composer install --no-interaction --quiet
fi

if [ ! -f ".env" ]; then
    warn ".env not found, copying from template..."
    cp "$PROJECT_ROOT/.env.example" .env
    run_php artisan key:generate --quiet
fi

if [ ! -f "database/database.sqlite" ]; then
    touch database/database.sqlite
fi

run_php artisan config:clear --quiet
if run_php artisan test; then
    ok "Backend tests passed"
else
    err "Backend tests FAILED"
    FAILED=1
fi
echo ""

# --- 2. Backend Build ---
info "[2/6] Building backend (production)..."
cd "$PROJECT_ROOT/backend"

run_composer install --no-dev --optimize-autoloader --no-interaction --quiet
run_php artisan config:cache --quiet 2>/dev/null
run_php artisan route:cache --quiet 2>/dev/null
run_php artisan view:cache --quiet 2>/dev/null
ok "Backend build passed"

# Restore dev dependencies for future test runs
run_composer install --no-interaction --quiet
echo ""

# --- 3. Frontend Build ---
info "[3/6] Running Angular frontend unit tests..."
cd "$PROJECT_ROOT/frontend"

if [ ! -d "node_modules" ]; then
    info "Installing npm dependencies..."
    npm ci --quiet
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

if npx ng test --watch=false --browsers=ChromeHeadless --no-progress; then
    ok "Frontend unit tests passed"
else
    err "Frontend unit tests FAILED"
    FAILED=1
fi
echo ""

# --- 4. Frontend Build ---
info "[4/6] Building Angular frontend (production)..."
cd "$PROJECT_ROOT/frontend"

if npx ng build --configuration=production 2>&1 | tail -3; then
    ok "Frontend build passed"
else
    err "Frontend build FAILED"
    FAILED=1
fi
echo ""

# --- 5. Documentation Build ---
info "[5/6] Building MkDocs documentation..."
cd "$PROJECT_ROOT/documentation"

setup_python_tooling || { err "Python not found"; exit 1; }

if ! run_python -m mkdocs --version &>/dev/null 2>&1; then
    info "Installing MkDocs dependencies..."
    run_python -m pip install -r requirements.txt --quiet
fi

if run_python -m mkdocs build --clean --quiet 2>&1; then
    ok "Documentation build passed"
else
    err "Documentation build FAILED"
    FAILED=1
fi
echo ""

# --- Optional E2E smoke ---
if [ "${RUN_E2E_SMOKE:-false}" = "true" ]; then
    info "[6/6] Running Playwright smoke test..."
    cd "$PROJECT_ROOT/frontend"

    if npm run e2e:smoke; then
        ok "Playwright smoke test passed"
    else
        err "Playwright smoke test FAILED"
        FAILED=1
    fi
    echo ""
else
    info "[6/6] Skipping Playwright smoke test (set RUN_E2E_SMOKE=true to enable)"
    echo ""
fi

# --- Verify artifacts ---
info "Verifying build artifacts..."
cd "$PROJECT_ROOT"

DIRS_OK=true
[ -d "frontend/dist" ] || { err "frontend/dist/ missing"; DIRS_OK=false; }
[ -d "backend/vendor" ] || { err "backend/vendor/ missing"; DIRS_OK=false; }
[ -d "documentation/site" ] || { err "documentation/site/ missing"; DIRS_OK=false; }

if [ "$DIRS_OK" = true ]; then
    ok "All build artifacts present"
else
    err "Some build artifacts missing"
    FAILED=1
fi
echo ""

# --- Result ---
info "============================================"
if [ "$FAILED" -eq 0 ]; then
    ok "  CI passed -- ready to tag a release!"
else
    err "  CI FAILED -- fix errors before tagging"
fi
info "============================================"

exit $FAILED
