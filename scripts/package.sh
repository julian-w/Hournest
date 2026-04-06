#!/usr/bin/env bash
source "$(dirname "$0")/common.sh"

VERSION="${1:-dev}"
DIST_DIR="$PROJECT_ROOT/dist"
PACKAGE_NAME="hournest-${VERSION}"
PACKAGE_DIR="$DIST_DIR/$PACKAGE_NAME"

info "=== Packaging Hournest $VERSION ==="
echo ""

# Clean
rm -rf "$DIST_DIR"
mkdir -p "$PACKAGE_DIR"

# Build everything first
"$SCRIPT_DIR/build-all.sh"
echo ""

info "Assembling deployment package..."

# Copy backend (without dev files)
info "Copying backend..."
if command -v rsync &>/dev/null; then
    rsync -a --exclude='node_modules' --exclude='.env' --exclude='tests' \
        --exclude='.phpunit.result.cache' --exclude='phpunit.xml' \
        --exclude='storage/logs/*' --exclude='storage/framework/cache/*' \
        --exclude='storage/framework/sessions/*' --exclude='storage/framework/views/*' \
        --exclude='.git' --exclude='database/database.sqlite' \
        "$PROJECT_ROOT/backend/" "$PACKAGE_DIR/"
else
    # Fallback without rsync (e.g., minimal environments)
    warn "rsync not found, using cp (some dev files may be included)"
    cp -r "$PROJECT_ROOT/backend/." "$PACKAGE_DIR"
    rm -rf "$PACKAGE_DIR/.env" \
           "$PACKAGE_DIR/tests" \
           "$PACKAGE_DIR/.git" \
           "$PACKAGE_DIR/.phpunit.result.cache" \
           "$PACKAGE_DIR/phpunit.xml" \
           "$PACKAGE_DIR/database/database.sqlite" \
           "$PACKAGE_DIR/storage/logs/"* \
           "$PACKAGE_DIR/storage/framework/cache/"* \
           "$PACKAGE_DIR/storage/framework/sessions/"* \
           "$PACKAGE_DIR/storage/framework/views/"*
fi

# Create required storage directories
mkdir -p "$PACKAGE_DIR/bootstrap/cache"
mkdir -p "$PACKAGE_DIR/storage/logs"
mkdir -p "$PACKAGE_DIR/storage/framework/cache"
mkdir -p "$PACKAGE_DIR/storage/framework/sessions"
mkdir -p "$PACKAGE_DIR/storage/framework/views"

# Copy .env.example as template
cp "$PROJECT_ROOT/.env.example" "$PACKAGE_DIR/.env.example"

# Bundle frontend directly into Laravel public/ for single-webroot hosting
info "Bundling frontend into public/..."
cp -r "$PROJECT_ROOT/frontend/dist/frontend/browser/"* "$PACKAGE_DIR/public/"

# Copy PHP installer
info "Copying installer..."
cp "$PROJECT_ROOT/scripts/install.php" "$PACKAGE_DIR/install.php"
cp "$PROJECT_ROOT/scripts/test.php" "$PACKAGE_DIR/test.php"

# Copy documentation build (if exists)
if [ -d "$PROJECT_ROOT/documentation/site" ]; then
    info "Copying documentation..."
    cp -r "$PROJECT_ROOT/documentation/site" "$PACKAGE_DIR/docs"
fi

# Create deployment readme
cat > "$PACKAGE_DIR/DEPLOY.md" << 'DEPLOYEOF'
# Hournest Deployment

## Quick Start

1. Upload the whole extracted folder to your web server.
2. Point your document root to `public/`.
3. The frontend is already bundled into `public/`.
4. Copy `.env.example` to `.env` and configure it.
5. Optionally run `php test.php` to check PHP, extensions, .env, and database connectivity.
6. Set a valid bcrypt hash for `SUPERADMIN_PASSWORD`.
7. Run `php install.php`.

## Detailed Instructions

See the documentation in `docs/` or at the project repository.
DEPLOYEOF

# Create archive
info "Creating archive..."
cd "$DIST_DIR"

if command -v zip &>/dev/null; then
    zip -r "${PACKAGE_NAME}.zip" "$PACKAGE_NAME/" -q
    ok "Created dist/${PACKAGE_NAME}.zip"
elif command -v tar &>/dev/null; then
    tar -czf "${PACKAGE_NAME}.tar.gz" "$PACKAGE_NAME/"
    ok "Created dist/${PACKAGE_NAME}.tar.gz"
else
    warn "Neither zip nor tar found. Package directory created at dist/${PACKAGE_NAME}/"
fi

echo ""
info "Restoring backend development dependencies..."
cd "$PROJECT_ROOT/backend"
setup_php_tooling || { err "PHP tooling not found"; exit 1; }
run_composer install --no-interaction --quiet

echo ""
ok "=== Packaging complete ==="
