#!/usr/bin/env bash
source "$(dirname "$0")/common.sh"

info "Preparing Laravel backend..."
cd "$PROJECT_ROOT/backend"

setup_php_tooling || { err "PHP tooling not found"; exit 1; }

info "Installing PHP dependencies (production)..."
run_composer install --no-dev --optimize-autoloader --no-interaction

info "Clearing and caching config..."
run_php artisan config:cache
run_php artisan route:cache
run_php artisan view:cache

ok "Backend prepared for production"
