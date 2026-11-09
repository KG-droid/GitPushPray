#!/usr/bin/env bash
# Deploys the joiner companion to Azure App Service (Linux, Node) in Italy North.
#
# Usage (after `az login --tenant <tenant-domain>`):
#   TEAM=NN RG=<resource-group> APP=app-teamNN-joiner-xxxx ./scripts/deploy-azure.sh
#
# Creates the plan and web app the first time, then just redeploys. Contains no secrets:
# the Claude key is set separately as an app setting (see SET_KEY below).
set -euo pipefail

: "${TEAM:?Set TEAM to your two-digit team number}"
: "${RG:?Set RG to your team resource group}"
: "${APP:?Set APP to the web app name, e.g. app-team${TEAM}-joiner-<suffix>}"
# UK South has no B1 App Service quota in the shared subscription, so Italy North (also allowed).
LOCATION="${LOCATION:-italynorth}"
PLAN="${PLAN:-asp-team${TEAM}-joiner}"
TAGS=(team="team${TEAM}" event=hackathon)

cd "$(dirname "$0")/.."

echo "› Building"
npm run build >/dev/null

echo "› Packaging"
rm -f /tmp/joiner-deploy.zip
zip -qr /tmp/joiner-deploy.zip dist dist-server

if ! az appservice plan show -g "$RG" -n "$PLAN" -o none 2>/dev/null; then
  echo "› Creating App Service plan $PLAN (B1, Linux, $LOCATION)"
  az appservice plan create -g "$RG" -n "$PLAN" -l "$LOCATION" --sku B1 --is-linux --tags "${TAGS[@]}" -o none
fi

if ! az webapp show -g "$RG" -n "$APP" -o none 2>/dev/null; then
  echo "› Creating web app $APP"
  az webapp create -g "$RG" -p "$PLAN" -n "$APP" --runtime "NODE:24-lts" --tags "${TAGS[@]}" -o none
  az webapp config set -g "$RG" -n "$APP" --startup-file "node dist-server/index.mjs" \
    --always-on true --min-tls-version 1.2 --ftps-state Disabled --http20-enabled true -o none
  az webapp update -g "$RG" -n "$APP" --https-only true -o none
  az webapp config appsettings set -g "$RG" -n "$APP" -o none \
    --settings SCM_DO_BUILD_DURING_DEPLOYMENT=false NODE_ENV=production
fi

# Optional: copy the Claude key from web/.env into App Settings without printing it.
if [[ "${SET_KEY:-0}" == "1" ]]; then
  KEY="$(grep -E '^ANTHROPIC_API_KEY=' .env | head -1 | cut -d= -f2-)"
  if [[ -n "$KEY" ]]; then
    echo "› Setting ANTHROPIC_API_KEY app setting"
    az webapp config appsettings set -g "$RG" -n "$APP" --settings ANTHROPIC_API_KEY="$KEY" -o none
  else
    echo "  (no key in web/.env; the assistant will run in offline mode)"
  fi
fi

echo "› Deploying"
az webapp deploy -g "$RG" -n "$APP" --src-path /tmp/joiner-deploy.zip --type zip --clean true -o none

echo "✓ https://${APP}.azurewebsites.net"
