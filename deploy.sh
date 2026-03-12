#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# deploy.sh — Production deployment helper
# Project STAR Safeguarding Course
# ═══════════════════════════════════════════════════════════════
#
# Usage:
#   ./deploy.sh             — show help
#   ./deploy.sh up          — start all services
#   ./deploy.sh down        — stop all services
#   ./deploy.sh restart     — restart all services
#   ./deploy.sh deploy      — pull latest code and rebuild the app
#   ./deploy.sh logs [svc]  — tail logs (default: all)
#   ./deploy.sh status      — show container status
#   ./deploy.sh db-shell    — open a psql shell in the db container
#   ./deploy.sh db-backup   — dump the database to a timestamped file
#   ./deploy.sh db-restore FILE — restore from a dump file
#   ./deploy.sh cert-renew  — force Let's Encrypt cert renewal
#   ./deploy.sh prune       — remove unused Docker images/volumes
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

# ── Colours ───────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; BOLD='\033[1m'; NC='\033[0m'
info()    { echo -e "${BLUE}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

# ── Detect compose command ─────────────────────────────────────
COMPOSE="docker compose"
command -v docker compose >/dev/null 2>&1 || COMPOSE="docker-compose"

# ── Source environment variables ───────────────────────────────
if [ -f ".env" ]; then
  set -a; source .env; set +a
else
  warn ".env not found — some commands (e.g. db-backup) may fail"
fi

BACKUP_DIR="./backups"

# ── Commands ──────────────────────────────────────────────────
cmd_up() {
  info "Starting all services..."
  $COMPOSE up -d
  success "All services started"
  cmd_status
}

cmd_down() {
  info "Stopping all services..."
  $COMPOSE down
  success "All services stopped"
}

cmd_restart() {
  info "Restarting all services..."
  $COMPOSE restart
  success "All services restarted"
  cmd_status
}

cmd_deploy() {
  info "Deploying latest code..."

  # Pull latest from git (if this is a git repo)
  if [ -d ".git" ]; then
    info "Pulling latest code from git..."
    git pull
  fi

  info "Rebuilding app container..."
  $COMPOSE build --no-cache app

  info "Restarting app container with zero-downtime..."
  $COMPOSE up -d --no-deps app

  success "Deployment complete"
  cmd_status
}

cmd_logs() {
  local SERVICE="${1:-}"
  if [ -n "$SERVICE" ]; then
    $COMPOSE logs -f --tail=100 "$SERVICE"
  else
    $COMPOSE logs -f --tail=100
  fi
}

cmd_status() {
  echo ""
  echo -e "${BOLD}Container Status:${NC}"
  $COMPOSE ps
  echo ""
}

cmd_db_shell() {
  info "Opening psql shell in db container..."
  $COMPOSE exec db psql -U "${POSTGRES_USER:-postgres}" -d "${POSTGRES_DB:-safeguarding}"
}

cmd_db_backup() {
  mkdir -p "$BACKUP_DIR"
  local TIMESTAMP
  TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
  local BACKUP_FILE="${BACKUP_DIR}/safeguarding_${TIMESTAMP}.sql.gz"

  info "Creating database backup: ${BACKUP_FILE}"
  $COMPOSE exec -T db \
    pg_dump -U "${POSTGRES_USER:-postgres}" "${POSTGRES_DB:-safeguarding}" \
    | gzip > "$BACKUP_FILE"

  local SIZE
  SIZE=$(du -sh "$BACKUP_FILE" | cut -f1)
  success "Backup saved: ${BACKUP_FILE} (${SIZE})"
}

cmd_db_restore() {
  local FILE="${1:-}"
  [ -z "$FILE" ] && error "Usage: ./deploy.sh db-restore <file.sql.gz>"
  [ -f "$FILE" ] || error "File not found: $FILE"

  warn "This will OVERWRITE the current database. Are you sure? (yes/no)"
  read -r CONFIRM
  [ "$CONFIRM" = "yes" ] || { info "Aborted."; exit 0; }

  info "Restoring database from ${FILE}..."
  gunzip -c "$FILE" | $COMPOSE exec -T db \
    psql -U "${POSTGRES_USER:-postgres}" "${POSTGRES_DB:-safeguarding}"
  success "Database restored from ${FILE}"
}

cmd_cert_renew() {
  info "Forcing Let's Encrypt certificate renewal..."
  $COMPOSE run --rm certbot renew --force-renewal
  info "Reloading Nginx..."
  $COMPOSE exec nginx nginx -s reload
  success "Certificate renewed and Nginx reloaded"
}

cmd_prune() {
  warn "Removing unused Docker images and build cache..."
  docker image prune -f
  docker builder prune -f
  success "Cleanup complete"
}

cmd_help() {
  echo ""
  echo -e "${BOLD}Project STAR Safeguarding — Deployment Helper${NC}"
  echo ""
  echo "  Usage: ./deploy.sh <command> [args]"
  echo ""
  echo -e "  ${BOLD}Commands:${NC}"
  echo "    up              Start all services"
  echo "    down            Stop all services"
  echo "    restart         Restart all services"
  echo "    deploy          Pull latest code, rebuild & restart app"
  echo "    logs [service]  Tail logs (app | nginx | db | certbot)"
  echo "    status          Show container status"
  echo "    db-shell        Open psql shell in db container"
  echo "    db-backup       Dump database to ./backups/"
  echo "    db-restore FILE Restore database from a .sql.gz file"
  echo "    cert-renew      Force Let's Encrypt certificate renewal"
  echo "    prune           Remove unused Docker images"
  echo ""
}

# ── Dispatch ──────────────────────────────────────────────────
COMMAND="${1:-help}"
shift || true

case "$COMMAND" in
  up)           cmd_up ;;
  down)         cmd_down ;;
  restart)      cmd_restart ;;
  deploy)       cmd_deploy ;;
  logs)         cmd_logs "${1:-}" ;;
  status)       cmd_status ;;
  db-shell)     cmd_db_shell ;;
  db-backup)    cmd_db_backup ;;
  db-restore)   cmd_db_restore "${1:-}" ;;
  cert-renew)   cmd_cert_renew ;;
  prune)        cmd_prune ;;
  help|--help|-h) cmd_help ;;
  *)            error "Unknown command: ${COMMAND}. Run ./deploy.sh help" ;;
esac
