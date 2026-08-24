#!/usr/bin/env bash
set -euo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
backup_dir="${1:-${project_root}/.backups}"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
archive="${backup_dir}/rc-world-${timestamp}.tar.gz"

mkdir -p "${backup_dir}"

tar \
  --exclude=.git \
  --exclude=.backups \
  --exclude=node_modules \
  --exclude=dist \
  --exclude=test-results \
  --exclude=playwright-report \
  -czf "${archive}" \
  -C "${project_root}" .

sha256sum "${archive}" > "${archive}.sha256"

echo "Backup: ${archive}"
echo "Checksum: ${archive}.sha256"
