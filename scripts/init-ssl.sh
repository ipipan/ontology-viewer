#!/usr/bin/env bash
# =============================================================================
# init-ssl.sh — One-time SSL bootstrap for initial deployment
# =============================================================================
# Usage: ./scripts/init-ssl.sh [domain]
#
# This script:
#   1. Creates required directories
#   2. Generates a self-signed SSL certificate (for nginx bootstrap)
#   3. Generates DH parameters (2048-bit)
#   4. Creates .env from .env.example if not present
#
# After running this script, start the stack and then run certbot:
#   docker compose up -d
#   docker compose run --rm certbot certonly \
#       --webroot -w /var/www/certbot -d your-domain.com
#   docker compose restart nginx
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Load domain from argument, .env, or default
DOMAIN="${1:-}"
if [[ -z "$DOMAIN" ]] && [[ -f "$PROJECT_ROOT/.env" ]]; then
    DOMAIN=$(grep -E '^DOMAIN_NAME=' "$PROJECT_ROOT/.env" | cut -d'=' -f2 | tr -d '"' | tr -d "'")
fi
DOMAIN="${DOMAIN:-example.com}"

echo "=== Ontology Viewer SSL Bootstrap ==="
echo "Domain: $DOMAIN"
echo ""

# --- Create directories ---
echo "[1/4] Creating directories..."
mkdir -p "$PROJECT_ROOT/nginx/ssl"
mkdir -p "$PROJECT_ROOT/certbot/conf"
mkdir -p "$PROJECT_ROOT/certbot/www"
echo "  ✓ Directories created"

# --- Generate self-signed certificate ---
SSL_DIR="$PROJECT_ROOT/nginx/ssl"
if [[ -f "$SSL_DIR/self-signed.crt" ]]; then
    echo "[2/4] Self-signed certificate already exists, skipping..."
else
    echo "[2/4] Generating self-signed SSL certificate..."
    openssl req -x509 -nodes -days 365 \
        -newkey rsa:2048 \
        -keyout "$SSL_DIR/self-signed.key" \
        -out "$SSL_DIR/self-signed.crt" \
        -subj "/C=PL/ST=State/L=City/O=OntologyViewer/CN=$DOMAIN" \
        2>/dev/null
    echo "  ✓ Self-signed certificate generated"
fi

# --- Generate DH parameters ---
if [[ -f "$SSL_DIR/dhparam.pem" ]]; then
    echo "[3/4] DH parameters already exist, skipping..."
else
    echo "[3/4] Generating DH parameters (2048-bit, this may take a moment)..."
    openssl dhparam -out "$SSL_DIR/dhparam.pem" 2048 2>/dev/null
    echo "  ✓ DH parameters generated"
fi

# --- Create .env if needed ---
if [[ -f "$PROJECT_ROOT/.env" ]]; then
    echo "[4/4] .env file already exists, skipping..."
else
    echo "[4/4] Creating .env from .env.example..."
    if [[ -f "$PROJECT_ROOT/.env.example" ]]; then
        cp "$PROJECT_ROOT/.env.example" "$PROJECT_ROOT/.env"
        sed -i "s/DOMAIN_NAME=example.com/DOMAIN_NAME=$DOMAIN/" "$PROJECT_ROOT/.env"
        sed -i "s|ALLOWED_ORIGINS=https://example.com|ALLOWED_ORIGINS=https://$DOMAIN|" "$PROJECT_ROOT/.env"
        echo "  ✓ .env created — review and adjust settings before deploying"
    else
        echo "  ⚠ .env.example not found, skipping"
    fi
fi

echo ""
echo "=== Bootstrap complete ==="
echo ""
echo "Next steps:"
echo "  1. Review and edit .env with your settings"
echo "  2. Start the stack:  docker compose up -d"
echo "  3. Obtain real SSL:  docker compose run --rm certbot certonly \\"
echo "                         --webroot -w /var/www/certbot -d $DOMAIN"
echo "  4. Restart nginx:   docker compose restart nginx"
echo "  5. Set up renewal:  crontab -e"
echo "     Add: 0 3 * * 1 $(pwd)/scripts/renew-ssl.sh"
