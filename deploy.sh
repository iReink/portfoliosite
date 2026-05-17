#!/usr/bin/env bash
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/iReink/portfoliosite.git}"
BRANCH="${BRANCH:-main}"
SITE_DIR="${SITE_DIR:-/var/www/portfoliosite}"
SERVER_NAME="${SERVER_NAME:-vbaranov.tech www.vbaranov.tech}"
NGINX_CONF="/etc/nginx/sites-available/portfoliosite"
CERT_DIR="/etc/letsencrypt/live/vbaranov.tech"
SUDO=""

if [ "${EUID:-$(id -u)}" -ne 0 ]; then
  SUDO="sudo"
fi

$SUDO apt-get update
$SUDO apt-get install -y git nginx

$SUDO mkdir -p "$(dirname "$SITE_DIR")"
$SUDO chown -R "$USER":"$USER" "$(dirname "$SITE_DIR")"

if [ ! -d "$SITE_DIR/.git" ]; then
  rm -rf "$SITE_DIR"
  git clone --branch "$BRANCH" "$REPO_URL" "$SITE_DIR"
else
  git -C "$SITE_DIR" fetch origin "$BRANCH"
  git -C "$SITE_DIR" reset --hard "origin/$BRANCH"
fi

if [ -f "$CERT_DIR/fullchain.pem" ] && [ -f "$CERT_DIR/privkey.pem" ]; then
  $SUDO tee "$NGINX_CONF" >/dev/null <<NGINX
server {
    listen 80;
    listen [::]:80;
    server_name $SERVER_NAME;

    location /.well-known/acme-challenge/ {
        root $SITE_DIR;
    }

    location / {
        return 301 https://\$host\$request_uri;
    }
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name $SERVER_NAME;

    root $SITE_DIR;
    index index.html;

    ssl_certificate $CERT_DIR/fullchain.pem;
    ssl_certificate_key $CERT_DIR/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;

    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
NGINX
else
  $SUDO tee "$NGINX_CONF" >/dev/null <<NGINX
server {
    listen 80;
    listen [::]:80;
    server_name $SERVER_NAME;

    root $SITE_DIR;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
NGINX
fi

$SUDO ln -sfn "$NGINX_CONF" /etc/nginx/sites-enabled/portfoliosite
$SUDO rm -f /etc/nginx/sites-enabled/default
$SUDO nginx -t
$SUDO systemctl enable nginx
$SUDO systemctl reload nginx

echo "Deployed: http://$SERVER_NAME"
