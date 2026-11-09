# Azure deployment

How the LBG Joiner Companion is hosted, and how to redeploy it. Written so any teammate, or any Claude Code session, can pick it up.

> **This repo is public.** Never commit the resource group name, tenant domain, tenant or subscription IDs, the team account name, or the Claude API key. Never paste `az` output that shows IDs. Query names and states only (for example `--query name -o tsv`). See [CLAUDE.md](../CLAUDE.md) and [M365_AZURE_INSTRUCTIONS.md](../M365_AZURE_INSTRUCTIONS.md).

## What's deployed

| | |
| --- | --- |
| **Live URL** | https://app-team04-joiner-a8a4.azurewebsites.net (QR code: [demo-qr.png](demo-qr.png)) |
| **Health check** | `/healthz` returns `ok (live)` with a Claude key set, or `ok (offline)` without one |
| **Team** | 04 |
| **Resource group** | The team's own group (on the team sheet; not written here). The deploy script finds it automatically, because the team account can only see that one group. |
| **App Service plan** | `asp-team04-joiner`, Linux, **B1**, **Italy North** |
| **Web app** | `app-team04-joiner-a8a4`, runtime `NODE\|24-lts` |
| **Tags** | `team=team04`, `event=hackathon` |
| **Startup command** | `node dist-server/index.mjs` |
| **Hardening** | HTTPS only (HTTP redirects with a 301), minimum TLS 1.2, FTP/FTPS disabled, HTTP/2 on, Always On |
| **App settings** | `SCM_DO_BUILD_DURING_DEPLOYMENT=false`, `NODE_ENV=production`, and optionally `ANTHROPIC_API_KEY` (the Claude key) and `ASSISTANT_MODEL` |
| **Cost** | B1 is about £10 a month, so pennies over the event. It counts against the team's £150 budget. |

### Why Italy North and App Service

- **Allowed regions are UK South and Italy North only.** Other regions are blocked by policy.
- **Static Web Apps isn't offered in either allowed region**, so we use App Service.
- **UK South has no B1 App Service quota** in the shared subscription. Creating the plan there fails with "Operation cannot be completed without additional quota… Current Limit (B1 App Service instances): 0". Italy North works.

### How the app is served

One Node process ([web/server/serve.ts](../web/server/serve.ts)) serves:

- the built PWA from `web/dist/`, with an SPA fallback to `index.html`, long-lived caching for hashed `/assets/*` files, and `no-cache` for the shell and service worker
- the assistant API: `POST /api/ask` (Server-Sent Events) and `POST /api/handover` (JSON), using the same code as local development ([web/server/http.ts](../web/server/http.ts))
- security headers (`nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`) and path-traversal protection

`npm run build` bundles the server and the Anthropic SDK into a single file, `web/dist-server/index.mjs` ([web/vite.server.config.ts](../web/vite.server.config.ts)). The deploy zip is just `dist/` plus `dist-server/`, so Azure doesn't need to run `npm install`.

The Claude key is read **only on the server** (from the `ANTHROPIC_API_KEY` app setting, or `web/.env` locally). It never reaches the browser bundle. Without a key, the assistant falls back to scripted offline answers, so the demo still works.

## Tools on the team Mac

These are installed in the home folder and aren't on the default `PATH`. In a new terminal, run:

```bash
export PATH="$HOME/.local/uv/bin:$HOME/.local/node/bin:$PATH"
```

- **Node 24 LTS** is in `~/.local/node`.
- **Azure CLI** is in `~/.local/uv/bin/az`. It was installed with [uv](https://github.com/astral-sh/uv), which brings its own Python, so it doesn't need the Xcode tools.

On another machine, install the [Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli) and Node 22 or later in the usual way.

## Sign in

A person has to do this, because it needs the team sheet and MFA:

```bash
az login --tenant <tenant-domain>
```

If the browser is signed in to a different Microsoft account, add `--use-device-code`. To check the sign-in without printing IDs, run:

```bash
az account show --query state -o tsv
```

## Redeploy after code changes

From `web/`:

```bash
TEAM=04 APP=app-team04-joiner-a8a4 ./scripts/deploy-azure.sh
```

The script ([web/scripts/deploy-azure.sh](../web/scripts/deploy-azure.sh)) does the following:

1. Runs `npm run build`, which runs the typecheck, the client build and the server bundle.
2. Zips `dist/` and `dist-server/`.
3. Creates the plan and web app if they don't exist yet, with the settings above. On later runs it skips this step.
4. Zip-deploys with `--clean true`.

Redeploys take a minute or two. The first deploy took about 10 minutes while Azure fetched the Node 24 environment.

## Set or change the Claude key

1. Put the key in `web/.env` (copy `web/.env.example`). `.env` is ignored by git.
2. From `web/`, run:

   ```bash
   TEAM=04 APP=app-team04-joiner-a8a4 SET_KEY=1 ./scripts/deploy-azure.sh
   ```

   This copies the key into App Settings with `-o none`, so it's never printed, and redeploys.
3. Check that `https://app-team04-joiner-a8a4.azurewebsites.net/healthz` returns `ok (live)`.

To change the model, set `ASSISTANT_MODEL` in the App Service settings. The default is `claude-haiku-5-5`.

## Verify a deploy

```bash
U=https://app-team04-joiner-a8a4.azurewebsites.net
curl -s $U/healthz
curl -s -o /dev/null -w "%{http_code}\n" $U/journey/checks
```

To confirm the live site is running the build you just made, compare the main script name:

```bash
grep -o 'assets/index-[^"]*\.js' dist/index.html
```

```bash
curl -s $U/ | grep -o 'assets/index-[^"]*\.js'
```

Then open the URL on a real phone. In Safari or Chrome, Share → **Add to Home Screen** opens it full-screen like an app.

## Troubleshooting

| Symptom | Cause and fix |
| --- | --- |
| `Operation cannot be completed without additional quota` | No B1 quota in that region. Stay in Italy North (the script's default). |
| Deploy ends with `Site failed to start` after about 600 seconds, but `/healthz` works | Azure's start-up check timed out on the first deploy. If `/healthz` responds and the script names match, the deploy worked. |
| `Please run 'az login'` | Not signed in on this machine. See [Sign in](#sign-in). |
| `az: command not found` or `npm: command not found` | Run the `export PATH=…` line in [Tools on the team Mac](#tools-on-the-team-mac). |
| Assistant shows **Offline mode** | No `ANTHROPIC_API_KEY` app setting. See [Set or change the Claude key](#set-or-change-the-claude-key). |
| `RequestDisallowedByPolicy` | Wrong region or SKU. Use Italy North or UK South and B1. |
| The app isn't responding | Check `az webapp log tail -g "$(az group list --query '[0].name' -o tsv)" -n app-team04-joiner-a8a4`. Don't paste log lines that contain IDs. |

## After the event

The organisers delete all resource groups on 13 November 2026. To stop costs earlier, delete the plan, which also removes the web app's compute:

```bash
az appservice plan delete -g "$(az group list --query '[0].name' -o tsv)" -n asp-team04-joiner --yes
```
