#!/bin/bash
set -euo pipefail

# Try normal install first.
if lefthook install; then
  exit 0
fi

# If hooksPath is customized, lefthook requires --force.
hooks_path="$(git config --get core.hooksPath || true)"
if [ -n "${hooks_path}" ]; then
  echo "[hooks] core.hooksPath=${hooks_path}; retrying with --force"
  lefthook install --force
  exit 0
fi

echo "[hooks] lefthook install failed"
exit 1
