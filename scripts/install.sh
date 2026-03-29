#!/usr/bin/env bash
# First-time installation script for Hournest on a target server.
# Run this AFTER uploading the release package or cloning the repository.
#
# Usage:
#   ./scripts/install.sh              # Interactive setup
#   ./scripts/install.sh --seed       # Also seed test data

source "$(dirname "$0")/common.sh"

SEED=false
if [ "${1:-}" = "--seed" ]; then
    SEED=true
fi

info "============================================"
info "  Hournest -- Server Installation"
info "============================================"
echo ""

# --- Pre-flight checks ---
info "Checking prerequisites..."

check_command php || { err "PHP not found. Install PHP 8.2+ first."; exit 1; }

PHP_VERSION=$(php -r 'echo PHP_MAJOR_VERSION . "." . PHP_MINOR_VERSION;')
info "PHP version: $PHP_VERSION"

# Check required PHP extensions
MISSING_EXT=""
for ext in pdo_sqlite mbstring openssl tokenizer xml curl fileinfo; do
    if ! php -m 2>/dev/null | grep -qi "^${ext}$"; then
        MISSING_EXT="$MISSING_EXT $ext"
    fi
done

if [ -n "$MISSING_EXT" ]; then
    err "Missing PHP extensions:$MISSING_EXT"
    err "Enable them in php.ini and restart."
    exit 1
fi
ok "All required PHP extensions present"
echo ""

# --- Backend setup ---
info "Setting up backend..."
cd "$PROJECT_ROOT/backend"

# Install dependencies if needed
if [ ! -d "vendor" ]; then
    info "Installing Composer dependencies..."
    if command -v composer &>/dev/null; then
        composer install --no-dev --optimize-autoloader --no-interaction
    elif [ -f "composer.phar" ]; then
        php composer.phar install --no-dev --optimize-autoloader --no-interaction
    else
        err "Composer not found. Install Composer first: https://getcomposer.org"
        exit 1
    fi
fi

# .env setup
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        info "Created .env from .env.example"
    elif [ -f "$PROJECT_ROOT/.env.example" ]; then
        cp "$PROJECT_ROOT/.env.example" .env
        info "Created .env from root .env.example"
    else
        err "No .env.example found. Cannot create .env."
        exit 1
    fi

    # Generate application key
    php artisan key:generate
    ok "Application key generated"
else
    info ".env already exists, skipping"
fi

echo ""
warn "==========================================="
warn "  Review and edit backend/.env now!"
warn "  At minimum configure:"
warn "    - APP_URL"
warn "    - FRONTEND_URL"
warn "    - DB_CONNECTION / DB_DATABASE"
warn "    - OIDC_* (for SSO login)"
warn "    - SUPERADMIN_PASSWORD (change from default!)"
warn "    - ADMIN_EMAILS"
warn "    - SANCTUM_STATEFUL_DOMAINS"
warn "==========================================="
echo ""
read -p "Press Enter when .env is configured (or Ctrl+C to abort)..."
echo ""

# Database setup
DB_CONNECTION=$(php -r "echo parse_ini_file('.env')['DB_CONNECTION'] ?? 'sqlite';")
info "Database connection: $DB_CONNECTION"

if [ "$DB_CONNECTION" = "sqlite" ]; then
    DB_DATABASE=$(php -r "echo parse_ini_file('.env')['DB_DATABASE'] ?? '';")
    if [ -n "$DB_DATABASE" ] && [ ! -f "$DB_DATABASE" ]; then
        touch "$DB_DATABASE"
        info "Created SQLite database: $DB_DATABASE"
    fi
fi

# Run migrations
info "Running database migrations..."
php artisan migrate --force
ok "Migrations complete"

# Seed if requested
if [ "$SEED" = true ]; then
    info "Seeding database with test data..."
    php artisan db:seed --force
    ok "Database seeded"
fi

# Cache config for production
info "Caching configuration..."
php artisan config:cache
php artisan route:cache
php artisan view:cache
ok "Caches built"

# Storage permissions
info "Setting storage permissions..."
chmod -R 775 storage bootstrap/cache 2>/dev/null || warn "Could not set permissions (may need sudo)"

echo ""

# --- Frontend check ---
info "Checking frontend..."
if [ -d "$PROJECT_ROOT/frontend/dist" ] || [ -d "$PROJECT_ROOT/frontend" ]; then
    ok "Frontend found"
else
    warn "Frontend not found. Build it with: ./scripts/build-frontend.sh"
fi

echo ""

# --- Webserver hints ---
info "============================================"
info "  Webserver Configuration"
info "============================================"
echo ""
info "Apache (.htaccess is included in backend/public/):"
info "  - Document Root: $(pwd)/public"
info "  - mod_rewrite must be enabled"
echo ""
info "Nginx (add to server block):"
echo ""
cat << 'NGINX'
    # Backend API (Laravel)
    location /api {
        try_files $uri $uri/ /index.php?$query_string;
    }
    location /sanctum {
        try_files $uri $uri/ /index.php?$query_string;
    }
    location /docs {
        try_files $uri $uri/ /index.php?$query_string;
    }
    location ~ \.php$ {
        fastcgi_pass unix:/run/php/php-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }

    # Frontend (SPA -- all non-API routes to index.html)
    location / {
        try_files $uri $uri/ /index.html;
    }
NGINX
echo ""

# --- Done ---
info "============================================"
ok "  Hournest installation complete!"
info "============================================"
echo ""
info "Next steps:"
info "  1. Configure your webserver (see above)"
info "  2. Open the app in your browser"
info "  3. Log in via SSO or Superadmin"
info "  4. As Admin: add holidays for the current year"
info "  5. As Admin: configure settings (work days, carryover)"
