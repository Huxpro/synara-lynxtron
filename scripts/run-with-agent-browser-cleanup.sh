#!/usr/bin/env bash

set -uo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cleanup_script="$repo_root/scripts/cleanup-agent-browser.sh"
child_pid=""

if (($# == 0)); then
  echo "usage: bun run browser:run -- <command> [args...]" >&2
  exit 64
fi

if ! "$cleanup_script"; then
  echo "agent-browser preflight cleanup failed; refusing to start browser workflow" >&2
  exit 1
fi

cleanup_on_exit() {
  local command_status=$?
  local cleanup_status=0

  trap - EXIT HUP INT TERM
  "$cleanup_script" || cleanup_status=$?

  if ((cleanup_status != 0)); then
    echo "agent-browser final cleanup failed after command status $command_status" >&2
    return "$cleanup_status"
  fi

  return "$command_status"
}

forward_signal() {
  local signal="$1"
  local status="$2"

  trap - HUP INT TERM
  if [[ -n "$child_pid" ]] && kill -0 "$child_pid" 2>/dev/null; then
    kill "-$signal" "$child_pid" 2>/dev/null || true
    wait "$child_pid" 2>/dev/null || true
  fi
  exit "$status"
}

trap cleanup_on_exit EXIT
trap 'forward_signal HUP 129' HUP
trap 'forward_signal INT 130' INT
trap 'forward_signal TERM 143' TERM

"$@" &
child_pid=$!
wait "$child_pid"
command_status=$?
child_pid=""
exit "$command_status"
