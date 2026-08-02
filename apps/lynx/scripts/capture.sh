#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "usage: SYNARA_LYNX_ROOT_PID=<pid> scripts/capture.sh <output.png>" >&2
  exit 2
fi

if [[ -z "${SYNARA_LYNX_ROOT_PID:-}" ]]; then
  echo 'SYNARA_LYNX_ROOT_PID is required; refusing to guess among user clients' >&2
  exit 2
fi

if ! kill -0 "$SYNARA_LYNX_ROOT_PID" 2>/dev/null; then
  echo "Lynx launch root $SYNARA_LYNX_ROOT_PID is not running" >&2
  exit 1
fi

SCRIPT_DIR=$(cd -- "$(dirname -- "$0")" && pwd)
APP_DIR=$(cd -- "$SCRIPT_DIR/.." && pwd)
DEVTOOL_CLI=${LYNX_DEVTOOL_CLI:-/Users/bytedance/.agents/skills/lynx-devtool/scripts/index.mjs}
OUTPUT=$1

descendants=("$SYNARA_LYNX_ROOT_PID")
index=0
while [[ $index -lt ${#descendants[@]} ]]; do
  parent=${descendants[$index]}
  while IFS= read -r child; do
    [[ -n "$child" ]] && descendants+=("$child")
  done < <(pgrep -P "$parent" 2>/dev/null || true)
  index=$((index + 1))
done

client=''
for pid in "${descendants[@]}"; do
  while IFS= read -r endpoint; do
    port=${endpoint##*:}
    candidate="localhost:$port"
    if node "$DEVTOOL_CLI" list-sessions -c "$candidate" >/dev/null 2>&1; then
      client=$candidate
      break 2
    fi
  done < <(lsof -nP -a -p "$pid" -iTCP -sTCP:LISTEN -Fn 2>/dev/null | sed -n 's/^n.*://p')
done

if [[ -z "$client" ]]; then
  echo "No DevTool client belongs to launch root $SYNARA_LYNX_ROOT_PID" >&2
  exit 1
fi

session=$(node "$DEVTOOL_CLI" list-sessions -c "$client" | node -e '
  let input = "";
  process.stdin.on("data", (chunk) => (input += chunk));
  process.stdin.on("end", () => {
    const sessions = JSON.parse(input);
    const lynx = sessions.filter((entry) => entry.type === "lynx");
    if (lynx.length === 0) process.exit(1);
    lynx.sort((a, b) => Number(a.session_id) - Number(b.session_id));
    process.stdout.write(String(lynx.at(-1).session_id));
  });
')

mkdir -p "$(dirname -- "$OUTPUT")"
cd "$APP_DIR"
node "$DEVTOOL_CLI" take-screenshot -c "$client" -s "$session" -o "$OUTPUT"
printf 'captured client=%s session=%s output=%s\n' "$client" "$session" "$OUTPUT"
