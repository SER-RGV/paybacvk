#!/usr/bin/env bash
# Runs the Godot headless test suite. Requires a Godot 4.7 binary (editor or template build).
#   GODOT_BIN=/path/to/godot tools/run_tests.sh [-- --filter=text]
# Scripts reference each other through preload() paths, so no editor import pass is required.
set -euo pipefail
GODOT_BIN="${GODOT_BIN:-godot}"
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"
exec "$GODOT_BIN" --headless --path . -s res://tests/run_tests.gd -- "$@"
