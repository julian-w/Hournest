#!/usr/bin/env bash
source "$(dirname "$0")/common.sh"

info "=== Starting Hournest Development Servers ==="
echo ""

# Trap to kill all background processes
trap 'info "Stopping all servers..."; kill 0; exit 0' INT TERM

# Backend (Laravel)
info "Starting Laravel backend on http://localhost:8000..."
cd "$PROJECT_ROOT/backend"
php artisan serve --port=8000 &

# Frontend (Angular)
info "Starting Angular frontend on http://localhost:4200..."
cd "$PROJECT_ROOT/frontend"
if [ ! -d "node_modules" ]; then
    npm ci
fi
npx ng serve --proxy-config proxy.conf.json &

echo ""
ok "Servers starting..."
info "Backend:  http://localhost:8000"
info "Frontend: http://localhost:4200"
info "API Docs: http://localhost:8000/docs/api"
echo ""
info "Press Ctrl+C to stop all servers"

# Wait for all background jobs
wait
