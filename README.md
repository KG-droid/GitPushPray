# LBG Joiner Companion

**Team 04 · Launchpad '26** ([mwlaunchpad.com](https://mwlaunchpad.com))

A mobile-first companion for new joiners at Lloyds Banking Group, from the day they accept an offer to Day 30. Joining a bank takes weeks of vetting, and the quiet stretch before Day 1 is when people drop out. The companion fills that gap with a guided, honest journey and an assistant that is there at 9pm on a Sunday.

**Live demo:** https://app-team04-joiner-a8a4.azurewebsites.net (QR code in [docs/demo-qr.png](docs/demo-qr.png)). Open it on a phone and use *Add to Home Screen* for the full-screen app.

All people, policies and data in this app are fictional.

## What it does

One journey engine drives four views.

| View | What it gives them |
| --- | --- |
| **Joiner** (Today, Journey, Explore, People, Ask) | One next step at a time. A parcel-tracker for vetting that is honest about delays. Laptop, headset and benefit choices. A Day 1 plan you can add to your calendar, with Teams message links to your buddy and manager. A jargon buster that explains SM&CR, DBS and the rest in plain English. A two-question "connected and confident" check-in at Day 10 and Day 30, with a Day 30 celebration. |
| **Manager** | What is left to do for each joiner, nudges before Day 1, goals that unlock the joiner's welcome pack, and a Day 30 confidence trend (trends only, never individual answers). Anything a joiner chose to send to their manager from the assistant lands at the top. A "gone quiet" nudge flags a joiner with no activity for a week before starting, with a one-tap hello. Managers also plan the joiner's first week by picking sessions that appear in the joiner's Day 1 plan and calendar. |
| **Buddy** | Why they were matched, a meetup tracker against Microsoft's research, and step-in alerts that come from events, not from private chats. |
| **Admin** (people experience) | Anonymous trends from check-ins and assistant topics, suggested process changes, and the queue of questions joiners chose to send to HR Direct or the screening team. |

Journeys are personalised by job family, location, work pattern, software and role (including SM&CR senior hires and first-time people managers). There are six demo joiners: Priya (engineer), Rhys (contact centre), Margaret (SM&CR risk), Jordan (branch), Aisha (graduate) and Sam (remote analyst), plus Nia (first-time team leader).

### The assistant

The Ask tab answers from eight short policy documents and cites the passage it used. It also knows where the joiner is in their own journey, so it can answer "what's left before I start?" or "why can't I choose my laptop yet?" with their real steps. It never discusses other colleagues' pay and never guesses at the outcome of someone's checks. When it cannot help, or the topic is personal, it offers a person (buddy, manager, HR Direct or the screening team), writes a short summary so the joiner doesn't repeat themselves, and passes it on only when the joiner taps send.

### Ideas from the brief we built for

- **Welcome, not another login:** no sign-in step for the joiner.
- **Chain reactions:** a manager setting goals sends the welcome pack; a joiner choosing a laptop creates an approval task for the manager.
- **Unlock the journey:** every step is an event-driven rule over checks, dates and persona. Locked steps say what unlocks them.
- **A journey that survives change:** slip the start date and the journey, due dates, manager tasks and messages all move.
- **9pm on a Sunday:** a policy-grounded assistant with a visible way to a person.

The research behind these choices is in [docs/market-research.md](docs/market-research.md) and the build plan is in [docs/plan.md](docs/plan.md).

## What is real and what is simulated

| Real | Simulated |
| --- | --- |
| The journey engine, unlock rules, date reflow and manager/buddy logic (unit tested) | All people, personas, check results and policies |
| The assistant: Claude answers from the policy documents, with citations and handover (when a key is configured) | Vetting, device ordering, system access, badges and payroll: nothing is connected to a real system |
| Check-in answers, handovers and meetups recorded as events and reflected in the other views | Chat replies from managers and buddies (scripted), and the addresses behind the Teams links (made up, so a link opens a chat to nobody real) |
| The PWA, served from Azure App Service | Storage: each phone keeps its own demo in the browser. A presenter can share a demo so other phones follow it live, but there is no database or real accounts |

Without a Claude key the assistant uses scripted answers and shows an **Offline mode** label, so the demo never breaks. On the live site, Claude is also limited to people with the demo link, and rate limited, so the key can't be used by strangers (see [docs/azure-deployment.md](docs/azure-deployment.md)).

## Run it

You need Node 22 or later.

```bash
cd web
npm install
cp .env.example .env     # optional: add ANTHROPIC_API_KEY for live assistant answers
npm run dev              # http://localhost:5173, also reachable from a phone on the same Wi-Fi
```

Other commands, all from `web/`:

```bash
npm test       # unit and component tests
npm run lint
npm run build  # typecheck, client build and server bundle
npm start      # serve the production build (the assistant API and the app on one port)
```

The API key is read only on the server, from `.env` locally or the `ANTHROPIC_API_KEY` app setting in Azure. It never reaches the browser. See [docs/azure-deployment.md](docs/azure-deployment.md) for hosting and redeploys.

## Presenting it

Long-press the logo (or press **Shift+D**) to open the demo controls:

- **share the demo** with a second phone (scan a QR code) so the manager and the joiner are on different phones and see each other's actions live, including time travel
- switch between joiner, manager, buddy and admin views, and between personas
- time travel to Offer accepted, 2 weeks to go, Day 1, end of week 1 and Day 30
- tap **Catch up to this date** after a time jump to mark everything due by then as done (the check-ins are left for you to do live)
- slip the start date by two weeks, stall the slowest check, or reset a persona

A good ten-minute path: Margaret's slow regulatory reference and the date slip, then Priya and Rhys getting different packs, then Daniel setting Priya's goals so her welcome pack appears, then the assistant declining a salary question and offering a person, then Aisha's Day 30 check-in and celebration, then the manager's confidence trend.

## Stack

React, TypeScript, Vite, MUI, installable PWA. A small Node server hosts the app and the assistant API (`web/server/`). Tests use Vitest and Testing Library.

## Working in this repo

This repo is public. Never commit keys, connection strings, tokens, or anything from the team sheet. Real values go in `web/.env`, which git ignores. See [CLAUDE.md](CLAUDE.md) and [M365_AZURE_INSTRUCTIONS.md](M365_AZURE_INSTRUCTIONS.md).
