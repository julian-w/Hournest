#!/usr/bin/env bash
source "$(dirname "$0")/common.sh"

info "Starting Angular frontend in Mock Mode..."
cd "$PROJECT_ROOT/frontend"

if [ ! -d "node_modules" ]; then
    info "Installing npm dependencies..."
    npm ci
fi

info "Frontend (Mock): http://localhost:4200"
info "No backend required. Use the role switcher at bottom-right."
echo ""

npx ng serve --configuration=mock
