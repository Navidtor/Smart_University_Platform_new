#!/usr/bin/env bash
#
# Run the full Smart University test suite using Docker images only.
# This does NOT require Maven or Node.js to be installed on the host.
#
# Usage (from repo root):
#   chmod +x scripts/run-tests.sh        # once (in Git Bash)
#   ./scripts/run-tests.sh               # run backend + frontend tests
#
# This is ideal from a Docker Desktop terminal or Git Bash: you only need Docker itself.

set -euo pipefail

ROOT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"

echo "==> Checking required tools..."

if ! command -v docker >/dev/null 2>&1; then
  echo "Error: Docker is required but not installed or not in PATH." >&2
  exit 1
fi

# On Git Bash / MSYS, Docker.exe may see path-converted arguments (e.g. /workspace -> C:/Program Files/Git/workspace),
# which breaks the container working directory. Disable automatic path conversion for docker arguments.
export MSYS2_ARG_CONV_EXCL='*'

echo "==> Running backend tests (Maven) inside Docker..."

docker run --rm \
  -v "${ROOT_DIR}":/workspace \
  -w /workspace \
  maven:3.9-eclipse-temurin-17 \
  mvn clean verify

echo "==> Backend tests completed successfully."

echo "==> Running frontend tests (npm test) inside Docker..."

docker run --rm \
  -v "${ROOT_DIR}/frontend":/app \
  -w /app \
  node:20-alpine \
  sh -c "npm install && npm test"

echo "==> Frontend tests completed successfully."

echo "==> All tests finished."