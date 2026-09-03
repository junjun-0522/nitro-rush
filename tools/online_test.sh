#!/bin/zsh
cd /private/tmp/claude-501/-Users-iwonjun/f626be45-d4c7-4c2a-a1a0-8108e5b79814/scratchpad
pkill -f harness.js; pkill -f "remote-debugging-port=9"; sleep 1
CODE="T$(LC_ALL=C tr -dc 'A-HJ-NP-Z2-9' </dev/urandom | head -c 3)"
echo "room code: $CODE" > online_summary.txt
node harness.js "${BASE:-http://127.0.0.1:8765/index.html}?autotest&norender&steps=1&online=host&room=$CODE&name=HOSTA&speed" ${1:-75} "" "" "JSON.stringify({state: __dbg.state, karts: __dbg.karts.map(function(k){return [k.name,k.netId,k.remote,+k.speed.toFixed(0),k.lapsCompleted,k.finished]})})" > run_host.log 2>&1 &
HP=$!
sleep 8
node harness.js "${BASE:-http://127.0.0.1:8765/index.html}?autotest&norender&steps=1&online=join&room=$CODE&name=GUESTB" $(( ${1:-75} - 10 )) "" "" "JSON.stringify({state: __dbg.state, karts: __dbg.karts.map(function(k){return [k.name,k.netId,k.remote,+k.speed.toFixed(0),k.lapsCompleted,k.finished]})})" > run_guest.log 2>&1 &
GP=$!
wait $HP $GP
{
echo "=== HOST ==="; grep -E "AUTOTEST\]|EXCEPTION|#err|eval" run_host.log | grep -v "GL Driver" | cut -c1-320 | awk '/room|joined|start|eval|EXCEPTION|#err|RESULTS|error/ || NR%6==0' | head -24
echo "=== GUEST ==="; grep -E "AUTOTEST\]|EXCEPTION|#err|eval" run_guest.log | grep -v "GL Driver" | cut -c1-320 | awk '/room|joined|start|eval|EXCEPTION|#err|RESULTS|error/ || NR%6==0' | head -24
} >> online_summary.txt
echo DONE >> online_summary.txt
