#!/usr/bin/env bash
source "$(dirname "$0")/common.sh"

info "Building Angular frontend..."
cd "$PROJECT_ROOT/frontend"

if [ ! -d "node_modules" ]; then
    info "Installing npm dependencies..."
    npm ci
fi

npx ng build --configuration=production
ok "Frontend built to frontend/dist/frontend/browser/"
