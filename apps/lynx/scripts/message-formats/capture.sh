#!/usr/bin/env bash
# One client, one thread, one theme: open the thread, measure every transcript
# text block at each scroll step, and screenshot each step.
#
# usage: capture.sh <web|lynx> <threadId> <dark|light> <label> [max shots]
#   MESSAGE_FORMATS_WEB_PORT  the isolated dev:web port (required)
#   MESSAGE_FORMATS_OUT       output directory (required; keep it outside the repo)
#   CLICK_TEXT, START_TOP     optional: scroll to START_TOP and click the text first
#
# Run it through the browser wrapper, which owns cleanup:
#   bun run browser:run -- apps/lynx/scripts/message-formats/capture.sh ...
set -uo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
port=${MESSAGE_FORMATS_WEB_PORT:?set MESSAGE_FORMATS_WEB_PORT}
S=${MESSAGE_FORMATS_OUT:?set MESSAGE_FORMATS_OUT}
client=$1; thread=$2; theme=$3; label=$4; shots=${5:-8}
out=$S/out; mkdir -p "$out" "$S/shots"
agent-browser set viewport 1280 820 >/dev/null
agent-browser set media $theme >/dev/null
if [[ $client == web ]]; then
  agent-browser open "http://localhost:$port/$thread" >/dev/null
  agent-browser wait 4000 >/dev/null
  for attempt in 1 2 3 4 5 6 7 8; do
    agent-browser wait 900 >/dev/null
    open=$(agent-browser eval 'document.querySelectorAll("[role=dialog],[role=alertdialog]").length + (document.querySelector("[data-chat-scroll-container]") ? 0 : 100)')
    [[ "$open" == "0" ]] && break
    agent-browser find text "Not now" click >/dev/null 2>&1 || true
    agent-browser find text "Skip tour" click >/dev/null 2>&1 || true
  done
  [[ "$open" == "0" ]] || echo "WARNING: web dialogs still open ($open)"
  agent-browser wait 800 >/dev/null
  SC='document.querySelector("[data-chat-scroll-container]")'
else
  agent-browser open "http://localhost:$port/lynx/?route=/thread/$thread" >/dev/null
  for attempt in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16; do
    agent-browser wait 1500 >/dev/null
    ready=$(agent-browser eval '(() => { const r=document.querySelector("lynx-view")?.shadowRoot; const l=r&&[...r.querySelectorAll("x-list")].find(e=>String(e.className).includes("TranscriptList")); return l && l.querySelectorAll("list-item").length > 1 && l.querySelectorAll("x-text").length > 1 ? "ready" : "wait" })()')
    [[ "$ready" == *ready* ]] && break
  done
  agent-browser wait 2500 >/dev/null
  agent-browser mouse move 811 33 >/dev/null; agent-browser mouse down >/dev/null; agent-browser mouse up >/dev/null
  agent-browser wait 800 >/dev/null
  SC='[...document.querySelector("lynx-view").shadowRoot.querySelectorAll("x-list")].find(e=>String(e.className).includes("TranscriptList"))'
fi
# CLICK_TEXT: click the element with this exact text (after scrolling to START_TOP)
start_top=${START_TOP:-0}
if [[ -n "${CLICK_TEXT:-}" ]]; then
  agent-browser eval "$SC.scrollTop = $start_top" >/dev/null; agent-browser wait 700 >/dev/null
  if [[ $client == web ]]; then
    pos=$(agent-browser eval "(() => { const w=document.createTreeWalker($SC, NodeFilter.SHOW_TEXT); for (let n=w.nextNode(); n; n=w.nextNode()) { if (n.nodeValue.trim() === '$CLICK_TEXT') { const r=n.parentElement.getBoundingClientRect(); return Math.round(r.left+r.width/2)+' '+Math.round(r.top+r.height/2); } } return ''; })()")
  else
    pos=$(agent-browser eval "(() => { const t=(e)=>e.tagName==='RAW-TEXT'?(e.getAttribute('text')||''):[...e.childNodes].map(c=>c.nodeType===3?c.nodeValue:c.nodeType===1?t(c):'').join(''); const el=[...$SC.querySelectorAll('x-text')].find(e=>t(e).trim()==='$CLICK_TEXT'); if(!el) return ''; const r=el.getBoundingClientRect(); return Math.round(r.left+r.width/2)+' '+Math.round(r.top+r.height/2); })()")
  fi
  pos=${pos//\"/}
  if [[ -n "$pos" ]]; then agent-browser mouse move $pos >/dev/null; agent-browser mouse down >/dev/null; agent-browser mouse up >/dev/null; agent-browser wait 1200 >/dev/null; else echo "CLICK_TEXT not found: $CLICK_TEXT"; fi
fi
rm -f $out/$label-$client-$theme.*.raw
total=$(agent-browser eval "$SC.scrollHeight - $SC.clientHeight")
step=620
i=0
while (( i < shots )); do
  top=$(( start_top + i * step ))
  agent-browser eval "$SC.scrollTop = $top" >/dev/null
  agent-browser wait 500 >/dev/null
  agent-browser screenshot $S/shots/$label-$client-$theme-$i.png >/dev/null
  agent-browser eval "$(cat "$here/measure.js")" > $out/$label-$client-$theme.$i.raw 2>&1
  if (( top >= total )); then break; fi
  i=$(( i + 1 ))
done
echo "$label $client $theme: scrollable=$total shots=$((i+1))"
