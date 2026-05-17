#!/usr/bin/env bash
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/iReink/portfoliosite.git}"
BRANCH="${BRANCH:-main}"
SITE_DIR="${SITE_DIR:-/var/www/portfoliosite}"
SERVER_NAME="${SERVER_NAME:-45.38.60.84}"
NGINX_CONF="/etc/nginx/sites-available/portfoliosite"

sudo apt-get update
sudo apt-get install -y git nginx

sudo mkdir -p "$(dirname "$SITE_DIR")"
sudo chown -R "$USER":"$USER" "$(dirname "$SITE_DIR")"

if [ ! -d "$SITE_DIR/.git" ]; then
  rm -rf "$SITE_DIR"
  git clone --branch "$BRANCH" "$REPO_URL" "$SITE_DIR"
else
  git -C "$SITE_DIR" fetch origin "$BRANCH"
  git -C "$SITE_DIR" reset --hard "origin/$BRANCH"
fi

sudo tee "$NGINX_CONF" >/dev/null <<NGINX
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

sudo ln -sfn "$NGINX_CONF" /etc/nginx/sites-enabled/portfoliosite
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl reload nginx

echo "Deployed: http://$SERVER_NAME"
