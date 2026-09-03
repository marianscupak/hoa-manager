#!/usr/bin/env bash
# Runs the study seed inside the production API container over SSH.
#   scripts/study-seed.sh seed    P3 jan@example.com ["Jan Novák"]   # phase 1, before the session
#   scripts/study-seed.sh open    P3                                  # phase 2, right after task O1
#   scripts/study-seed.sh cleanup P3 [jan@example.com]                # after the session
# Override the SSH host with HOA_SERVER_SSH (default: the "hoa-server" alias).
# DRY_RUN=1 prints the remote command instead of running it.
set -euo pipefail

usage() {
  sed -n '2,7p' "$0" | sed 's/^# \{0,1\}//'
  exit 64
}

mode="${1:-}"
participant="${2:-}"
email="${3:-}"
name="${4:-}"
host="${HOA_SERVER_SSH:-hoa-server}"

args=()
case "$mode" in
  seed)
    [[ -n "$participant" && -n "$email" ]] || usage
    args=(--participant "$participant" --email "$email")
    [[ -n "$name" ]] && args+=(--name "$name")
    ;;
  open)
    [[ -n "$participant" ]] || usage
    args=(--open "$participant")
    ;;
  cleanup)
    [[ -n "$participant" ]] || usage
    args=(--cleanup "$participant")
    [[ -n "$email" ]] && args+=(--email "$email")
    ;;
  *) usage ;;
esac

# printf %q keeps names with spaces and diacritics intact across the SSH hop.
quoted=$(printf '%q ' "${args[@]}")
remote="cd /opt/hoa-manager && docker compose run --rm api node dist/infrastructure/db/study-seed ${quoted}"

if [[ -n "${DRY_RUN:-}" ]]; then
  echo "ssh $host $remote"
  exit 0
fi
ssh "$host" "$remote"
