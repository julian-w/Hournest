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
        --exclude='storage/logs/*' --exclude='storage/framework/cache/*' \
        --exclude='storage/framework/sessions/*' --exclude='storage/framework/views/*' \
        --exclude='.git' --exclude='database/database.sqlite' \
        "$PROJECT_ROOT/backend/" "$PACKAGE_DIR/backend/"
else
    # Fallback without rsync (e.g., minimal environments)
    warn "rsync not found, using cp (some dev files may be included)"
    cp -r "$PROJECT_ROOT/backend" "$PACKAGE_DIR/backend"
    rm -rf "$PACKAGE_DIR/backend/.env" \
           "$PACKAGE_DIR/backend/tests" \
           "$PACKAGE_DIR/backend/.git" \
           "$PACKAGE_DIR/backend/database/database.sqlite" \
           "$PACKAGE_DIR/backend/storage/logs/"* \
           "$PACKAGE_DIR/backend/storage/framework/cache/"* \
           "$PACKAGE_DIR/backend/storage/framework/sessions/"* \
           "$PACKAGE_DIR/backend/storage/framework/views/"*
fi

# Create required storage directories
mkdir -p "$PACKAGE_DIR/backend/bootstrap/cache"
mkdir -p "$PACKAGE_DIR/backend/storage/logs"
mkdir -p "$PACKAGE_DIR/backend/storage/framework/cache"
mkdir -p "$PACKAGE_DIR/backend/storage/framework/sessions"
mkdir -p "$PACKAGE_DIR/backend/storage/framework/views"

# Copy .env.example as template
cp "$PROJECT_ROOT/.env.example" "$PACKAGE_DIR/backend/.env.example"

# Bundle frontend directly into Laravel public/ for single-webroot hosting
info "Bundling frontend into backend/public/..."
cp -r "$PROJECT_ROOT/frontend/dist/frontend/browser/"* "$PACKAGE_DIR/backend/public/"

# Copy install scripts
info "Copying install scripts..."
mkdir -p "$PACKAGE_DIR/scripts"
cp "$PROJECT_ROOT/scripts/install.sh" "$PACKAGE_DIR/scripts/install.sh"
cp "$PROJECT_ROOT/scripts/common.sh" "$PACKAGE_DIR/scripts/common.sh"

# Copy documentation build (if exists)
if [ -d "$PROJECT_ROOT/documentation/site" ]; then
    info "Copying documentation..."
    cp -r "$PROJECT_ROOT/documentation/site" "$PACKAGE_DIR/docs"
fi

# Create deployment readme
cat > "$PACKAGE_DIR/DEPLOY.md" << 'DEPLOYEOF'
# Hournest Deployment

## Quick Start

1. Upload `backend/` to your PHP web server (document root = `backend/public/`)
2. The frontend is already bundled into `backend/public/`
3. Copy `backend/.env.example` to `backend/.env` and configure
4. Optionally open `backend/public/superadmin-password-helper.php` once to generate a bcrypt hash
5. Run: `./scripts/install.sh`

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
