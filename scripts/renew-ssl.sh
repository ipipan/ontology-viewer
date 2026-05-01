#!/usr/bin/env bash
# =============================================================================
# renew-ssl.sh — Let's Encrypt certificate renewal
# =============================================================================
# Usage: ./scripts/renew-ssl.sh
#
# Add to crontab for automatic renewal (weekly check):
#   0 3 * * 1 /path/to/ontology-viewer-deepseek/scripts/renew-ssl.sh >> /var/log/certbot-renew.log 2>&1
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting certificate renewal check..."

# Attempt renewal
docker compose run --rm certbot renew --quiet

# Reload nginx to pick up any new certificates
docker compose exec -T nginx nginx -s reload

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Renewal check completed."
