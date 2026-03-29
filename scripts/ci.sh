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
info "[1/5] Running backend tests..."
cd "$PROJECT_ROOT/backend"

check_command php || { err "PHP not found"; exit 1; }

if [ ! -d "vendor" ]; then
    info "Installing Composer dependencies..."
    composer install --no-interaction --quiet
fi

if [ ! -f ".env" ]; then
    warn ".env not found, copying from template..."
    cp "$PROJECT_ROOT/.env.example" .env
    php artisan key:generate --quiet
fi

if [ ! -f "database/database.sqlite" ]; then
    touch database/database.sqlite
fi

if php artisan test; then
    ok "Backend tests passed"
else
    err "Backend tests FAILED"
    FAILED=1
fi
echo ""

# --- 2. Backend Build ---
info "[2/5] Building backend (production)..."
cd "$PROJECT_ROOT/backend"

composer install --no-dev --optimize-autoloader --no-interaction --quiet
php artisan config:cache --quiet 2>/dev/null
php artisan route:cache --quiet 2>/dev/null
php artisan view:cache --quiet 2>/dev/null
ok "Backend build passed"

# Restore dev dependencies for future test runs
composer install --no-interaction --quiet
echo ""

# --- 3. Frontend Build ---
info "[3/5] Building Angular frontend (production)..."
cd "$PROJECT_ROOT/frontend"

if [ ! -d "node_modules" ]; then
    info "Installing npm dependencies..."
    npm ci --quiet
fi

if npx ng build --configuration=production 2>&1 | tail -3; then
    ok "Frontend build passed"
else
    err "Frontend build FAILED"
    FAILED=1
fi
echo ""

# --- 4. Documentation Build ---
info "[4/5] Building MkDocs documentation..."
cd "$PROJECT_ROOT/documentation"

PYTHON_CMD="python3"
command -v python3 &>/dev/null || PYTHON_CMD="python"

if ! $PYTHON_CMD -m mkdocs --version &>/dev/null 2>&1; then
    info "Installing MkDocs dependencies..."
    $PYTHON_CMD -m pip install -r requirements.txt --quiet
fi

if $PYTHON_CMD -m mkdocs build --clean --quiet 2>&1; then
    ok "Documentation build passed"
else
    err "Documentation build FAILED"
    FAILED=1
fi
echo ""

# --- 5. Verify artifacts ---
info "[5/5] Verifying build artifacts..."
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
