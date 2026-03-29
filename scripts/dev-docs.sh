#!/usr/bin/env bash
source "$(dirname "$0")/common.sh"

info "Starting MkDocs development server..."
cd "$PROJECT_ROOT/documentation"

PYTHON_CMD="python3"
command -v python3 &>/dev/null || PYTHON_CMD="python"

check_command "$PYTHON_CMD"

if ! $PYTHON_CMD -m mkdocs --version &>/dev/null; then
    info "Installing MkDocs dependencies..."
    $PYTHON_CMD -m pip install -r requirements.txt --quiet
fi

info "Documentation: http://localhost:8001"
$PYTHON_CMD -m mkdocs serve --dev-addr=localhost:8001
