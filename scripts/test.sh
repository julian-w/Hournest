#!/usr/bin/env bash
source "$(dirname "$0")/common.sh"

info "=== Running Hournest Tests ==="
echo ""

# Backend tests
info "Running PHP backend tests..."
cd "$PROJECT_ROOT/backend"
php artisan test
echo ""

# Frontend build check (Angular doesn't have custom tests yet, but build verifies types)
info "Verifying Angular frontend build..."
cd "$PROJECT_ROOT/frontend"
if [ ! -d "node_modules" ]; then
    npm ci
fi
npx ng build --configuration=production 2>&1 | tail -5
echo ""

ok "=== All tests passed ==="
