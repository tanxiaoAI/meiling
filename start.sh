#!/bin/sh

echo "=== START SCRIPT RUNNING ===" >&2
echo "PWD: $(pwd)" >&2
echo "PORT: ${PORT:-4096}" >&2

DIR="$(cd "$(dirname "$0")" && pwd)"
echo "SCRIPT_DIR: $DIR" >&2

DISTDIR="$DIR/vendor/opencode/packages/opencode/dist"
echo "DISTDIR: $DISTDIR" >&2

if [ ! -d "$DISTDIR" ]; then
  echo "FATAL: dist directory not found at $DISTDIR" >&2
  ls -la "$DIR/vendor/opencode/packages/opencode/" >&2 2>/dev/null || true
  exit 1
fi

BIN=""
for f in "$DISTDIR"/*/bin/opencode; do
  if [ -f "$f" ]; then
    BIN="$f"
    break
  fi
done

if [ -z "$BIN" ]; then
  echo "FATAL: binary not found, listing dist/:" >&2
  find "$DISTDIR" -type f 2>/dev/null | head -30 >&2 || true
  exit 1
fi

echo "BINARY: $BIN" >&2

export MEILING_FIXED_ASSET_SOURCE_DIR="$DISTDIR/assets/git"
echo "ASSET_DIR: $MEILING_FIXED_ASSET_SOURCE_DIR" >&2

if [ -d "$MEILING_FIXED_ASSET_SOURCE_DIR" ]; then
  echo "ASSET_OK: $(ls "$MEILING_FIXED_ASSET_SOURCE_DIR" 2>/dev/null || true)" >&2
else
  echo "ASSET_MISSING: $MEILING_FIXED_ASSET_SOURCE_DIR" >&2
fi

echo "=== STARTING BINARY ===" >&2
exec "$BIN" serve --hostname 0.0.0.0 --port "${PORT:-4096}"
