#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
export MEILING_FIXED_ASSET_SOURCE_DIR="$SCRIPT_DIR/vendor/opencode/meiling/assets/git"

BIN=$(find "$SCRIPT_DIR/vendor/opencode/packages/opencode/dist" -path '*/bin/opencode' -type f | head -1)
exec "$BIN" serve --hostname 0.0.0.0 --port "${PORT:-4096}"
