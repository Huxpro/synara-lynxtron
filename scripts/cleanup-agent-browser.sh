#!/usr/bin/env bash

set -euo pipefail

max_attempts="${AGENT_BROWSER_CLEANUP_ATTEMPTS:-12}"
delay_seconds="${AGENT_BROWSER_CLEANUP_DELAY_SECONDS:-0.25}"

session_count() {
  agent-browser session list --json |
    node -e '
      let input = "";
      process.stdin.setEncoding("utf8");
      process.stdin.on("data", (chunk) => {
        input += chunk;
      });
      process.stdin.on("end", () => {
        const result = JSON.parse(input);
        const sessions = result?.data?.sessions;
        if (!Array.isArray(sessions)) {
          process.exit(2);
        }
        process.stdout.write(String(sessions.length));
      });
    '
}

browser_processes() {
  ps ax -o pid=,command= |
    awk '
      $2 ~ /\/agent-browser-darwin-arm64$/ ||
      (($0 ~ /^[ ]*[0-9]+[ ]+\/Applications\/Google Chrome[.]app\// ||
        $0 ~ /^[ ]*[0-9]+[ ]+.*\/Chromium[.]app\//) &&
       ($0 ~ /agent-browser-chrome-/ ||
        index($0, ".agent-browser/") > 0)) {
        print
      }
    '
}

debugging_processes() {
  ps ax -o pid=,command= |
    awk '
      ($0 ~ /^[ ]*[0-9]+[ ]+\/Applications\/Google Chrome[.]app\// ||
       $0 ~ /^[ ]*[0-9]+[ ]+.*\/Chromium[.]app\//) &&
      /remote-debugging-port/ {
        print
      }
    '
}

terminate_browser_processes() {
  local signal="$1"
  local processes
  processes="$(browser_processes)"
  if [[ -z "$processes" ]]; then
    return
  fi

  while read -r pid _; do
    if [[ -n "$pid" ]]; then
      kill "-$signal" "$pid" 2>/dev/null || true
    fi
  done <<<"$processes"
}

agent-browser close --all >/dev/null 2>&1 || true

for ((attempt = 1; attempt <= max_attempts; attempt += 1)); do
  if [[ "$(session_count)" == "0" ]] &&
    [[ -z "$(browser_processes)" ]] &&
    [[ -z "$(debugging_processes)" ]]; then
    echo "agent-browser cleanup passed: no active sessions or browser processes"
    exit 0
  fi

  agent-browser close --all >/dev/null 2>&1 || true
  terminate_browser_processes TERM
  sleep "$delay_seconds"
done

terminate_browser_processes KILL
sleep "$delay_seconds"

sessions="$(agent-browser session list --json)"
owned_processes="$(browser_processes)"
remote_debugging_processes="$(debugging_processes)"

if [[ "$(printf '%s' "$sessions" | node -e '
  let input = "";
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (chunk) => {
    input += chunk;
  });
  process.stdin.on("end", () => {
    const result = JSON.parse(input);
    process.stdout.write(String(result?.data?.sessions?.length ?? -1));
  });
')" == "0" ]] &&
  [[ -z "$owned_processes" ]] &&
  [[ -z "$remote_debugging_processes" ]]; then
  echo "agent-browser cleanup passed: no active sessions or browser processes"
  exit 0
fi

echo "agent-browser cleanup failed" >&2
echo "sessions: $sessions" >&2
if [[ -n "$owned_processes" ]]; then
  echo "agent-browser processes:" >&2
  printf '%s\n' "$owned_processes" >&2
fi
if [[ -n "$remote_debugging_processes" ]]; then
  echo "remote debugging processes (not terminated unless agent-browser-owned):" >&2
  printf '%s\n' "$remote_debugging_processes" >&2
fi
exit 1
