#!/usr/bin/env bash
source "$(dirname "$0")/common.sh"

info "Preparing Laravel backend..."
cd "$PROJECT_ROOT/backend"

check_command php

COMPOSER_CMD="composer"
if ! command -v composer &>/dev/null; then
    if [ -f "composer.phar" ]; then
        COMPOSER_CMD="php composer.phar"
    else
        err "Composer not found. Install it first."
        exit 1
    fi
fi

info "Installing PHP dependencies (production)..."
$COMPOSER_CMD install --no-dev --optimize-autoloader --no-interaction

info "Clearing and caching config..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

ok "Backend prepared for production"
