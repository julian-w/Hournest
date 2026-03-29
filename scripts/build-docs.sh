#!/usr/bin/env bash
source "$(dirname "$0")/common.sh"

info "Building MkDocs documentation..."
cd "$PROJECT_ROOT/documentation"

PYTHON_CMD="python3"
command -v python3 &>/dev/null || PYTHON_CMD="python"

check_command "$PYTHON_CMD"

if ! $PYTHON_CMD -m mkdocs --version &>/dev/null; then
    info "Installing MkDocs dependencies..."
    $PYTHON_CMD -m pip install -r requirements.txt --quiet
fi

$PYTHON_CMD -m mkdocs build --clean
ok "Documentation built to documentation/site/"
