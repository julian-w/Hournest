#!/usr/bin/env bash
source "$(dirname "$0")/common.sh"

info "=== Building Hournest (all components) ==="
echo ""

"$SCRIPT_DIR/build-frontend.sh"
echo ""
"$SCRIPT_DIR/build-backend.sh"
echo ""
"$SCRIPT_DIR/build-docs.sh"
echo ""

ok "=== All components built successfully ==="
