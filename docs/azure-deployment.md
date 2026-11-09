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
| **App settings** | `SCM_DO_BUILD_DURING_DEPLOYMENT=false`, `NODE_ENV=production`, `DATA_DIR=/home/data`, and optionally `ANTHROPIC_API_KEY` (the Claude key), `DEMO_ACCESS_CODE`, `ASSISTANT_MODEL`, `RATE_LIMIT_PER_MINUTE`, `DAILY_LIVE_LIMIT` and `INSIGHTS_LIVE` |
| **Cost** | B1 is about £10 a month, so pennies over the event. It counts against the team's £150 budget. |

### Why Italy North and App Service

- **Allowed regions are UK South and Italy North only.** Other regions are blocked by policy.
- **Static Web Apps isn't offered in either allowed region**, so we use App Service.
- **UK South has no B1 App Service quota** in the shared subscription. Creating the plan there fails with "Operation cannot be completed without additional quota… Current Limit (B1 App Service instances): 0". Italy North works.

### How the app is served

One Node process ([web/server/serve.ts](../web/server/serve.ts)) serves:

- the built PWA from `web/dist/`, with an SPA fallback to `index.html`, long-lived caching for hashed `/assets/*` files, and `no-cache` for the shell and service worker
- the assistant API: `POST /api/ask` (Server-Sent Events) and `POST /api/handover` (JSON), using the same code as local development ([web/server/http.ts](../web/server/http.ts))
- shared demos: `POST /api/session`, then `GET`/`POST /api/session/<code>/ops` (see [Shared demos](#shared-demos))
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

## Shared demos

By default each phone has its own private demo, kept in that browser, so judges can't affect each other. To show a manager on one phone and a joiner on another, open the demo controls (long-press the logo, or Shift+D), tap **Share with another phone**, pick Manager, Joiner or Buddy, and scan the QR code on the second phone. Both phones then follow the same data and the same simulated date, live (they check in about every 1.5 seconds). Each phone still chooses its own persona and role.

- The server keeps an ordered log of demo actions per shared demo (a code like `ETHC26EZ`). It never reads inside them. Only synthetic demo data is stored, and a shared demo is deleted a day after it was last used.
- Data lives in `/home/data/sessions.json` (`DATA_DIR`), which survives restarts and redeploys. Without `DATA_DIR`, shared demos are kept in memory and disappear on a restart.
- If the connection drops, a phone keeps working and catches up when it returns. If a shared demo has expired, the phone carries on privately with what it has.
- **Stop sharing** puts a phone back on a private copy of what it was showing.
- The shared link doesn't include the Claude access code, so the assistant on a second phone is on scripted answers unless that phone also opened the judges' link.
- A shared demo's code is the only thing protecting it. Don't put a shared link in the repo or on a public screen you don't mind judges joining.

## Keeping the Claude key private

The key lives only in App Settings (and your local `web/.env`). Three things stop strangers spending it. None of them break the app: a request that fails a check gets the scripted offline answers, so the demo never shows an error.

1. **Access code.** Live Claude needs the `DEMO_ACCESS_CODE` value in an `X-Demo-Key` header. The judges' link, `https://<app>/?k=<code>`, carries it. The page keeps the code in the browser and removes it from the address bar. Anyone without it can use the whole app but sees **Offline mode** in the Ask tab.
2. **Rate limits.** Each address gets 20 live requests a minute (`RATE_LIMIT_PER_MINUTE`) and the whole site 500 a day (`DAILY_LIVE_LIMIT`). Counters are in memory, so they reset if the app restarts.
3. **Spend cap.** Use a dedicated key in its own Claude Platform workspace with a low monthly limit. This is the backstop for everything else.

The admin page's suggested changes stay on the built-in baseline unless `INSIGHTS_LIVE=1`.

**Share the tokenised link and QR code on slides or a printed card, not in this repo.** The committed [demo-qr.png](demo-qr.png) is the plain URL on purpose. To rotate the code, change `DEMO_ACCESS_CODE` in App Settings and make a new QR. After the event, delete the key in the Claude console.

On an iPhone, a home-screen app has its own storage, so the code from the browser isn't shared with it. Tell judges to use the link in the browser, or open the tokenised link from inside the installed app.

## Set or change the Claude key

1. Put the key in `web/.env` (copy `web/.env.example`). `.env` is ignored by git.
2. From `web/`, run:

   ```bash
   TEAM=04 APP=app-team04-joiner-a8a4 SET_KEY=1 ./scripts/deploy-azure.sh
   ```

   This copies the key into App Settings with `-o none`, so it's never printed, and redeploys. It also makes a `DEMO_ACCESS_CODE` (saved in `.env`) if there isn't one, and prints the judges' link.
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
