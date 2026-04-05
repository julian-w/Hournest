#!/usr/bin/env bash
# Shared functions for Hournest build scripts

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

info()  { echo -e "${BLUE}[INFO]${NC} $*"; }
ok()    { echo -e "${GREEN}[OK]${NC} $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $*"; }
err()   { echo -e "${RED}[ERROR]${NC} $*" >&2; }

# Detect project root (parent of scripts/)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

check_command() {
    if ! command -v "$1" &>/dev/null; then
        err "$1 is not installed or not in PATH"
        return 1
    fi
}

find_command_candidate() {
    local pattern
    local candidate

    for pattern in "$@"; do
        while IFS= read -r candidate; do
            if [ -f "$candidate" ]; then
                printf '%s\n' "$candidate"
                return 0
            fi
        done < <(compgen -G "$pattern" || true)
    done

    return 1
}

ensure_command() {
    local command_name="$1"
    shift || true

    if command -v "$command_name" &>/dev/null; then
        return 0
    fi

    local candidate
    if candidate="$(find_command_candidate "$@")"; then
        export PATH="$(dirname "$candidate"):$PATH"
        return 0
    fi

    err "$command_name is not installed or not in PATH"
    return 1
}

setup_php_tooling() {
    local php_candidate=""
    local composer_candidate=""
    local shim_dir=""

    if command -v php &>/dev/null; then
        PHP_BIN="$(command -v php)"
    elif command -v php.exe &>/dev/null; then
        PHP_BIN="$(command -v php.exe)"
    elif php_candidate="$(find_command_candidate \
        "/mnt/c/Users/*/AppData/Local/Microsoft/WinGet/Packages/PHP.PHP.*/php.exe" \
        "/c/Users/*/AppData/Local/Microsoft/WinGet/Packages/PHP.PHP.*/php.exe")"; then
        PHP_BIN="$php_candidate"
    else
        err "php is not installed or not in PATH"
        return 1
    fi

    export PHP_BIN

    if [[ "$PHP_BIN" == *.exe ]] && ! command -v php &>/dev/null; then
        shim_dir="${TMPDIR:-/tmp}/hournest-tooling"
        mkdir -p "$shim_dir"
        cat > "$shim_dir/php" <<EOF
#!/usr/bin/env bash
"$PHP_BIN" "\$@"
EOF
        chmod +x "$shim_dir/php"
        export PATH="$shim_dir:$PATH"
    fi

    if composer_candidate="$(command -v composer 2>/dev/null || true)"; then
        true
    elif composer_candidate="$(find_command_candidate \
        "/mnt/c/Users/*/AppData/Local/Microsoft/WinGet/Packages/PHP.PHP.*/composer" \
        "/c/Users/*/AppData/Local/Microsoft/WinGet/Packages/PHP.PHP.*/composer")"; then
        true
    else
        err "composer is not installed or not in PATH"
        return 1
    fi

    if [[ "$PHP_BIN" == *.exe ]]; then
        if command -v wslpath &>/dev/null && [[ "$composer_candidate" == /mnt/* ]]; then
            COMPOSER_CMD="\"$PHP_BIN\" \"$(wslpath -w "$composer_candidate")\""
        else
            COMPOSER_CMD="\"$PHP_BIN\" \"$composer_candidate\""
        fi
    else
        COMPOSER_CMD="$composer_candidate"
    fi

    export COMPOSER_CMD
}

run_php() {
    "$PHP_BIN" "$@"
}

run_composer() {
    eval "$COMPOSER_CMD" "$@"
}

setup_python_tooling() {
    local python_candidate=""
    local shim_dir=""

    if command -v python3 &>/dev/null; then
        PYTHON_BIN="$(command -v python3)"
    elif command -v python &>/dev/null; then
        PYTHON_BIN="$(command -v python)"
    elif command -v python.exe &>/dev/null; then
        PYTHON_BIN="$(command -v python.exe)"
    elif python_candidate="$(find_command_candidate \
        "/mnt/c/Python*/python.exe" \
        "/mnt/c/Users/*/AppData/Local/Programs/Python/Python*/python.exe" \
        "/c/Python*/python.exe" \
        "/c/Users/*/AppData/Local/Programs/Python/Python*/python.exe")"; then
        PYTHON_BIN="$python_candidate"
    else
        err "python is not installed or not in PATH"
        return 1
    fi

    export PYTHON_BIN

    if [[ "$PYTHON_BIN" == *.exe ]] && ! command -v python &>/dev/null; then
        shim_dir="${TMPDIR:-/tmp}/hournest-tooling"
        mkdir -p "$shim_dir"
        cat > "$shim_dir/python" <<EOF
#!/usr/bin/env bash
"$PYTHON_BIN" "\$@"
EOF
        chmod +x "$shim_dir/python"
        export PATH="$shim_dir:$PATH"
    fi
}

run_python() {
    "$PYTHON_BIN" "$@"
}
