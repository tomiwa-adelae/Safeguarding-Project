#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# init-letsencrypt.sh — First-time SSL certificate setup
# Project STAR Safeguarding Course
# ═══════════════════════════════════════════════════════════════
#
# Run ONCE on a fresh server before starting the stack normally.
# This script:
#   1. Creates Certbot directory structure
#   2. Issues a temporary self-signed certificate so Nginx can
#      start (Nginx refuses to start without cert files present)
#   3. Starts Nginx so it can serve the ACME http-01 challenge
#   4. Replaces the self-signed cert with a real Let's Encrypt cert
#   5. Reloads Nginx to serve the real certificate
#
# Usage:
#   chmod +x init-letsencrypt.sh
#   ./init-letsencrypt.sh
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

# ── Configuration ─────────────────────────────────────────────
DOMAIN="safeguarding.projectstarlgs.com"
EMAIL="adelaetomiwa6@gmail.com"      # Used for expiry notifications
CERTBOT_DIR="./certbot"
RSA_KEY_SIZE=4096
STAGING=0   # Set to 1 to test against Let's Encrypt staging server
            # (avoids rate limits during testing; change to 0 for production)

# ── Colours ───────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()    { echo -e "${GREEN}[INFO]${NC}  $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

# ── Pre-flight checks ─────────────────────────────────────────
command -v docker        >/dev/null 2>&1 || error "docker is not installed"
command -v docker compose >/dev/null 2>&1 || \
  command -v docker-compose >/dev/null 2>&1 || error "docker compose is not installed"

# Detect which compose command to use
COMPOSE="docker compose"
command -v docker compose >/dev/null 2>&1 || COMPOSE="docker-compose"

# Ensure .env exists before we proceed
if [ ! -f ".env" ]; then
  error ".env file not found. Copy .env.production to .env and fill in your values first."
fi

info "Domain:  $DOMAIN"
info "Email:   $EMAIL"
echo ""

# ── Step 1: Create required directories ───────────────────────
info "Creating Certbot directory structure..."
mkdir -p "${CERTBOT_DIR}/conf/live/${DOMAIN}"
mkdir -p "${CERTBOT_DIR}/www"
success "Directories created"

# ── Step 2: Generate temporary self-signed certificate ────────
# Nginx cannot start if the SSL cert paths it references don't exist.
# We create a throwaway self-signed cert; Certbot will replace it.
# NOTE: --entrypoint must be a single executable token (Docker does not
# shell-parse it). We use `--entrypoint sh` and pass the full openssl
# command as the container's CMD argument via `-c "..."`.
info "Generating temporary self-signed certificate..."
$COMPOSE run --rm --no-deps --entrypoint sh certbot -c \
  "openssl req -x509 -nodes \
     -newkey rsa:${RSA_KEY_SIZE} \
     -days 1 \
     -keyout '/etc/letsencrypt/live/${DOMAIN}/privkey.pem' \
     -out    '/etc/letsencrypt/live/${DOMAIN}/fullchain.pem' \
     -subj   '/CN=localhost' \
     2>/dev/null"
success "Temporary certificate created"

# ── Step 2b: Generate Diffie-Hellman parameters ───────────────
# Required by the DHE-RSA cipher in nginx/conf.d/app.conf.
# 2048-bit is fast to generate and considered secure.
info "Generating DH parameters (2048-bit) — this takes ~30 seconds..."
if [ ! -f "${CERTBOT_DIR}/conf/ssl-dhparams.pem" ]; then
  $COMPOSE run --rm --no-deps --entrypoint sh certbot -c \
    "openssl dhparam -out /etc/letsencrypt/ssl-dhparams.pem 2048 2>/dev/null"
  success "DH parameters generated: ${CERTBOT_DIR}/conf/ssl-dhparams.pem"
else
  info "DH parameters already exist — skipping"
fi

# ── Step 3: Start Nginx (and the app + db) ────────────────────
info "Starting Nginx (needed to serve the ACME challenge)..."
$COMPOSE up --force-recreate -d nginx app db
info "Waiting 10 seconds for Nginx to become ready..."
sleep 10
success "Nginx is up"

# ── Step 4: Request the real Let's Encrypt certificate ────────
info "Requesting Let's Encrypt certificate for ${DOMAIN}..."

# Build staging flag
STAGING_FLAG=""
if [ "$STAGING" -eq 1 ]; then
  warn "Using Let's Encrypt STAGING server (cert will NOT be browser-trusted)"
  STAGING_FLAG="--staging"
fi

$COMPOSE run --rm --entrypoint sh certbot -c \
  "certbot certonly \
     --webroot \
     --webroot-path=/var/www/certbot \
     --email ${EMAIL} \
     --agree-tos \
     --no-eff-email \
     --rsa-key-size ${RSA_KEY_SIZE} \
     --force-renewal \
     ${STAGING_FLAG} \
     -d ${DOMAIN}"

success "Let's Encrypt certificate obtained"

# ── Step 5: Reload Nginx to serve the real certificate ────────
info "Reloading Nginx..."
$COMPOSE exec nginx nginx -s reload
success "Nginx reloaded with the new certificate"

# ── Done ──────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  SSL setup complete!${NC}"
echo -e "${GREEN}  Your site is live at: https://${DOMAIN}${NC}"
echo -e "${GREEN}══════════════════════════════════════════════════════${NC}"
echo ""
info "Certificate will auto-renew every 12 hours (via the certbot container)."
info "To check renewal status: $COMPOSE logs certbot"
