#!/usr/bin/env bash
set -euo pipefail

# Dumps the database configured by DATABASE_URL into ./backups/ (custom format).
# Schedule daily via cron or your host’s backup runner. See RESTORE.md.

: "${DATABASE_URL:?Set DATABASE_URL (e.g. postgres://user:pass@host:5432/db)}"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT_DIR="${ROOT}/backups"
mkdir -p "${OUT_DIR}"

STAMP="$(date -u +"%Y%m%dT%H%M%SZ")"
FILE="${OUT_DIR}/marketforge-${STAMP}.dump"

echo "Writing ${FILE}"
pg_dump "${DATABASE_URL}" -Fc -f "${FILE}"
echo "Done."
