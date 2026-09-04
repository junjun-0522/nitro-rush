#!/bin/zsh
# GPU screenshot of a static page (Chrome writes the PNG then hangs, so we wait for the file and kill it).
#   tools/shot.sh "http://127.0.0.1:8765/tools/track_view.html?track=4&s=0.2" out.png [wait_ms=7000]
URL="$1"; OUT="$2"; T=${3:-7000}
CH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
PROF="${TMPDIR:-/tmp}/nitro_shot_$$"; rm -rf "$PROF"; rm -f "$OUT"
"$CH" --headless=new --ignore-gpu-blocklist --no-sandbox --mute-audio --user-data-dir="$PROF" --window-size=1280,800 --timeout=$T --screenshot="$OUT" "$URL" >/dev/null 2>&1 &
PID=$!
for i in {1..60}; do [ -s "$OUT" ] && break; sleep 0.5; done
sleep 0.5; kill $PID 2>/dev/null; wait $PID 2>/dev/null; rm -rf "$PROF"
[ -s "$OUT" ] && echo "shot ok: $OUT ($(stat -f%z "$OUT") bytes)" || echo "shot FAILED: $OUT"
