#!/usr/bin/env bash
#
# Convenience script to start the full Smart University stack via docker-compose.
# This version relies on Docker multi-stage builds to run Maven inside containers,
# so Maven is NOT required on the host.
#
# Usage:
#   ./scripts/start-platform.sh          # docker-compose up --build
#   DETACH=1 ./scripts/start-platform.sh # docker-compose up -d --build
#

set -euo pipefail

ROOT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"

echo "==> Checking required tools..."

if ! command -v docker >/dev/null 2>&1; then
  echo "Error: Docker is required but not installed or not in PATH." >&2
  exit 1
fi

# Check for docker compose (V2) or docker-compose (V1)
if docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_CMD="docker-compose"
else
  echo "Error: docker compose is required but not installed or not in PATH." >&2
  exit 1
fi

echo "==> Starting full stack with $COMPOSE_CMD (builds images as needed)..."

cd "$ROOT_DIR"

DOCKER_ARGS=("up" "--build")
if [ "${DETACH:-0}" = "1" ]; then
  DOCKER_ARGS+=("-d")
fi

$COMPOSE_CMD "${DOCKER_ARGS[@]}"
