# Launchpad team project

This is a team's project for the Launchpad hackathon. All teams share one Azure and Microsoft 365 tenant and one subscription, so a mistake here can affect other teams. `M365_AZURE_INSTRUCTIONS.md` has the full rules, and `CLAUDE_CODE_INSTRUCTIONS.md` covers signing in.

`NN` below is the team's two-digit number.

## Azure and Microsoft 365

- Create Azure resources only in the team's own resource group.
- Never change anything belonging to another team, or any tenant-wide setting.
- Deploy only to UK South or Italy North.

## Naming

| What | Pattern |
| --- | --- |
| Azure resources | `<type>-teamNN-<purpose>` |
| Globally unique Azure names | Same pattern with a short random suffix, for example `kv-teamNN-a91f`. Storage accounts allow only lowercase letters and numbers, for example `stteamNNdata7x2`. |
| Entra ID app registrations | `teamNN-<purpose>` |
| Test users | `teamNN-<name>` |
| Microsoft 365 groups, Teams and SharePoint sites | `TeamNN - <name>` |

## Secrets

Treat this repo as public. Never commit:

- Passwords, keys, client secrets, connection strings or tokens.
- Anything from the team sheet, including the account name and tenant domain.
- Tenant or subscription IDs, or CLI output, screenshots or logs that show them.

Keep real values in a local `.env`, which is ignored by git, and put placeholders in `.env.example`.

## This project (team 04)

- The app is in `web/`: React, TypeScript, Vite and MUI, mobile-first PWA. `docs/plan.md` has the build plan and `docs/market-research.md` has the research.
- It's deployed to Azure App Service. Read `docs/azure-deployment.md` before changing or redeploying anything in Azure. It covers the live URL, the region (Italy North, because UK South has no B1 quota), the redeploy script, the Claude key and troubleshooting.
- Node and the Azure CLI on the team Mac are in the home folder and aren't on `PATH`. Run `export PATH="$HOME/.local/uv/bin:$HOME/.local/node/bin:$PATH"` first.
- Before committing, run `npm run build`, `npm test` and `npm run lint` in `web/`.
