#!/bin/sh
set -eu

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ASSET_DIR="$SCRIPT_DIR/vendor/opencode/packages/opencode/dist/assets/git"

echo "=== Meiling Start Diagnostics ==="
echo "SCRIPT_DIR: $SCRIPT_DIR"
echo "PORT: ${PORT:-4096}"
echo "ASSET_DIR: $ASSET_DIR"
echo "PWD: $(pwd)"

# --- Diagnostic: check asset directory ---
if [ -d "$ASSET_DIR" ]; then
  echo "[OK] Asset directory exists: $ASSET_DIR"
  echo "  Files in asset root: $(ls "$ASSET_DIR" 2>/dev/null | tr '\n' ' ')"
else
  echo "[FAIL] Asset directory NOT FOUND: $ASSET_DIR"
  echo "  Checking parent directories..."
  for parent in "$SCRIPT_DIR/vendor/opencode/packages/opencode/dist" "$SCRIPT_DIR/vendor/opencode/packages/opencode" "$SCRIPT_DIR/vendor/opencode"; do
    if [ -d "$parent" ]; then
      echo "  [OK] $parent exists"
    else
      echo "  [MISSING] $parent does NOT exist"
    fi
  done
  echo "=== End Diagnostics (asset missing) ==="
  exit 1
fi

export MEILING_FIXED_ASSET_SOURCE_DIR="$ASSET_DIR"
echo "MEILING_FIXED_ASSET_SOURCE_DIR=$MEILING_FIXED_ASSET_SOURCE_DIR"

# --- Find binary ---
BIN=$(find "$SCRIPT_DIR/vendor/opencode/packages/opencode/dist" -path '*/bin/opencode' -type f 2>/dev/null | head -1)

if [ -z "$BIN" ] || [ ! -f "$BIN" ]; then
  echo "[FAIL] Binary NOT FOUND in dist/"
  echo "  Listing dist/ contents:"
  find "$SCRIPT_DIR/vendor/opencode/packages/opencode/dist" -maxdepth 3 -type f 2>/dev/null | head -20 || echo "  (dist/ is empty or does not exist)"
  echo "=== End Diagnostics (binary missing) ==="
  exit 1
fi

echo "[OK] Binary found: $BIN"
echo "=== Starting server ==="

exec "$BIN" serve --hostname 0.0.0.0 --port "${PORT:-4096}"
