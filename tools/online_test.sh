#!/bin/zsh
# 2-player online smoke test (host + guest in two headless Chromes).
#   BASE=http://127.0.0.1:8765/index.html EXTRA="&relay=ws://127.0.0.1:8787" OUT=/path/to/dir tools/online_test.sh 70
# EXTRA is appended to both URLs (e.g. "&relay=ws://127.0.0.1:8787" to test the local relay, "&net=p2p" to force PeerJS).
# Results: $OUT/online_summary.txt (+ run_host.log / run_guest.log)
DIR="$(cd "$(dirname "$0")" && pwd)"
OUT="${OUT:-${TMPDIR:-/tmp}/nitro_online}"; mkdir -p "$OUT"; cd "$OUT"
BASE="${BASE:-http://127.0.0.1:8765/index.html}"
DUR=${1:-75}
pkill -f "tools/harness.js" 2>/dev/null; sleep 1
CODE="T$(LC_ALL=C tr -dc 'A-HJ-NP-Z2-9' </dev/urandom | head -c 3)"
echo "room code: $CODE  extra: ${EXTRA}" > online_summary.txt
EVAL='JSON.stringify({state: __dbg.state, rtt: (window.__onlineRtt||null), karts: __dbg.karts.map(function(k){return [k.name,k.netId,k.remote,+k.speed.toFixed(0),k.lapsCompleted,k.finished]})})'
node "$DIR/harness.js" "${BASE}?autotest&norender&steps=1&online=host&room=$CODE&name=HOSTA&speed${EXTRA}" $DUR "" "" "$EVAL" > run_host.log 2>&1 &
HP=$!
sleep 8
node "$DIR/harness.js" "${BASE}?autotest&norender&steps=1&online=join&room=$CODE&name=GUESTB${EXTRA}" $(( DUR - 10 )) "" "" "$EVAL" > run_guest.log 2>&1 &
GP=$!
wait $HP $GP
{
echo "=== HOST ==="; grep -E "AUTOTEST\]|EXCEPTION|#err|eval" run_host.log | grep -v "GL Driver" | cut -c1-320 | awk '/room|joined|start|eval|EXCEPTION|#err|RESULTS|error/ || NR%6==0' | head -24
echo "=== GUEST ==="; grep -E "AUTOTEST\]|EXCEPTION|#err|eval" run_guest.log | grep -v "GL Driver" | cut -c1-320 | awk '/room|joined|start|eval|EXCEPTION|#err|RESULTS|error/ || NR%6==0' | head -24
} >> online_summary.txt
echo DONE >> online_summary.txt
cat online_summary.txt
