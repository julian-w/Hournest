#!/usr/bin/env bash
source "$(dirname "$0")/common.sh"

info "Building MkDocs documentation..."
cd "$PROJECT_ROOT/documentation"

setup_python_tooling || { err "Python not found"; exit 1; }

if ! run_python -m mkdocs --version &>/dev/null; then
    info "Installing MkDocs dependencies..."
    run_python -m pip install -r requirements.txt --quiet
fi

run_python -m mkdocs build --clean
ok "Documentation built to documentation/site/"
