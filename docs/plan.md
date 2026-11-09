# Build plan: LBG new-joiner companion (draft for review)

**One-liner:** A mobile companion that turns the weeks of bank vetting into a guided, honest journey and gets each joiner to *connected and confident* by Day 30. It has a policy-grounded assistant on hand at 9pm on a Sunday.

**Elevator pitch for Checkpoint 1 (problem & approach):** Workday records joining but doesn't guide anyone through it. The riskiest stretch is the long, silent wait before Day 1: each extra week between offer and start raises the odds of a no-show by about 22% ([research](market-research.md)). We build one journey engine that drives three views (joiner, manager and buddy) and personalises the experience by job family, location and software. Alongside it is an AI assistant that cites policy and knows when to hand over to a person.

---

## 1. Architecture

```
┌──────────────── PWA (Vite + React + TS + MUI) ────────────────┐
│  Joiner app  │  Manager view  │  Buddy view  │  Demo panel    │
│        └──────────── Journey engine (pure TS) ───────────┘    │
│              Data layer (repository interface)                │
│              └─ MockRepository: typed seed data + localStorage│
└───────────────────────────────┬───────────────────────────────┘
                                │ /api/ask (POST)
                    ┌───────────▼───────────┐
                    │ Azure Functions (Node)│ ← CLAUDE_API_KEY in app settings
                    │ Claude + policy docs  │
                    └───────────────────────┘
```

- **Hosting:** Azure Static Web Apps (UK South) with its built-in managed Functions for `/api`. That gives one resource, one deploy and HTTPS by default. The resource name would be something like `swa-teamNN-joiner`.
- **Journey engine:** pure TypeScript functions with no UI. `getJourney(persona, events, today)` returns stages, steps, what is unlocked and what is next. Because it is easy to unit test, it also counts as evidence for Technical Approach.
- **Data layer:** a `Repository` interface. The mock version sits on seed data plus localStorage, so demo actions stick and a "Reset demo" button clears them. A SQLite API could replace it later without UI changes.
- **Events model** (from the "Unlock the Journey" side quest): everything is an event, such as `offer_accepted`, `check_cleared:id`, `kit_chosen`, `buddy_assigned`, `goals_set` and `start_date_changed`. An unlock is a rule over events plus persona attributes.

## 2. Personas

Depth is still to be decided (see open question 1). The proposal is to build three in full, marked ★, and give the other three their own content and timings on top of the same engine.

| # | Persona | Job family | Location | Distinctive journey |
|---|---------|-----------|----------|---------------------|
| ★1 | **Priya**, Software Engineer | Technology | Leeds (Wellington Place) | Laptop + dev kit choice, GitHub/Azure DevOps access, engineering guild channels, "first PR" goal |
| ★2 | **Rhys**, Customer Service Advisor | Contact centre | Cardiff | No kit choice (desk set-up), shift pattern, telephony training, cohort induction |
| ★3 | **Margaret**, Head of Credit Risk | Risk (SM&CR role) | London | Regulatory references take ~6 weeks, Statement of Responsibilities, **the date-slip demo** |
| 4 | **Jordan**, Branch Colleague | Retail | Birmingham | Site-based Day 1, cash-handling training, branch manager as buddy |
| 5 | **Aisha**, Graduate | Graduate programme | Bristol | Cohort start date, rotations, graduate network |
| 6 | **Sam**, Data Analyst (remote) | Data | Home-based (Manchester contract) | Kit delivered to home, virtual Day 1, remote-working allowance |

All names, people and policies are fictional.

## 3. Joiner app (bottom tabs: Today · Journey · People · Ask)

### Onboarding entry
- **J0 Welcome / warm handover:** a personal welcome message and a short video placeholder from the recruiter ("Hi Priya, it's Sophie, your recruiter…"). One button, "Let's get you ready", with no new password, to answer the "welcome, not another login" prompt. Shows the persona's role, start date and a Day-1 countdown.

### Today tab (one next action, not a to-do list)
- **J1 Today:** a greeting, the Day-1 countdown ring, and **one hero card** with the most useful next action (e.g. "Choose your laptop"). Below it: "What's happening" (a vetting update and the latest unlock) and a "This week" preview with at most 3 items. After Day 1 the countdown is replaced by Week 1 prompts and the Day-30 pulse.

### Journey tab (where am I?)
- **J2 Journey timeline:** six stages running vertically: Offer → Vetting & Unlock → Meet your people → Manager ready → Day 1 to Week 1 → Day 30. Each is shown as done, current or locked. Locked items say *what unlocks them* ("Unlocks when your references are back"), so they feel **earned, not withheld**.
- **J3 Vetting tracker:** parcel-tracking style, with ID, Right to work, Criminal record, Credit, Regulatory reference (SM&CR only) and Cleared. Each check shows a plain-English status, an honest time estimate and "what you can do" (e.g. "Nudge your previous employer"). It never shows sensitive results. When there's no news, it explains the delay honestly: "No news is normal — references usually take 2–4 weeks."
- **J4 Choices:** laptop (by job family: the manager sets the spec, standard or developer, then the joiner picks a Surface Pro, Surface Laptop or HP EliteBook G11), benefits, pay and rewards (salary sacrifice options, pension), and learning picks. These are cards with a selected state. Making a choice raises an event, e.g. kit chosen → a "device ordered" step appears on the manager's list.
- **J5 Unlocked content:** a feed of content filtered by persona, such as location guides (site, transport, community), team handbook and software guides. Each item has an "Unlocked because…" chip.
- **J6 Day 1 to Week 1:** guided prompts: book stakeholder intros (one-tap suggested slots), start mandatory training (with progress), join comms channels, and the week-1 1:1 with the manager.
- **J7 Day-30 check-in:** a two-question pulse ("I know who to ask", "I feel confident in my role"), the connection signals so far, and a celebration screen.

### People tab (meet before you meet)
- **J8 People:** manager and buddy cards (photo, short bio, "ask me about…", a fun fact) and a team strip.
- **J9 Chat:** a mocked chat thread with manager or buddy, with suggested icebreakers.

### Ask tab (9pm on a Sunday)
- **J10 Assistant:** a chat UI with suggested questions for the persona, answers with **source chips** (policy name and section), and a confidence or "I'm not sure" state. A visible **"Talk to a person"** button hands over to HR or the buddy with a summary of the conversation. It politely declines questions about other people or pay negotiation, or anything that isn't in the policies.

## 4. Manager view (the hiring manager's companion)
- **M1 My joiners:** a list of the manager's joiners with stage, status (On track / Waiting on checks / Needs action) and days to start.
- **M2 Joiner detail – what's left:** a checklist of checks, buddy, device, access, ID badge and 3-month goals. Completing an item raises an event. **Setting goals sends the welcome pack**, and the joiner app updates live (the "chain reactions" prompt).
- **M3 Just-in-time nudges:** cards based on the Google research ("Priya starts Monday: here are 5 things that matter most"), plus cover handling: "Going on leave? Hand over to a deputy."
- **M4 Day-30 signal:** the joiner's pulse trend and buddy meeting count, with suggested actions if they're quietly struggling. The manager sees signals, not private chat content.

### System access: one request, many owners
New colleagues need access to many systems that are each run by a different team (Entra, Teams, GitHub, Jira, Confluence, line-of-business applications). We don't replace those teams' approvals. We put one front door on them.

- **The manager asks once (M2).** They start from a role profile or copy a teammate, see what the team already has, adjust and submit. This unlocks only when vetting has cleared.
- **The request fans out.** Each item goes to the owner of its system by that system's own route: role-profile groups are automatic, team and project owners approve theirs, and applications go through the service desk to the application owner.
- **The manager sees the detail, the joiner sees progress.** The manager's task shows each system, who approves it and its status: With approver, Being set up, After training or Ready. The joiner's "Your system access" page (`/journey/access`) shows only how much is ready, how much is in progress and what waits for training, because system and group names mean little to someone who hasn't started.
- **It's honest about what isn't Day 1.** Some access only switches on after training (telephony, cash handling, customer data). Anything not expected until after Day 1 is flagged to the manager, with the owner to chase.
- **The joiner chases nobody.** One sign-in on Day 1 opens everything that's ready, and anything missing goes back through the manager's single request.

Simulated for the demo: owners and lead times are illustrative, and status moves with the demo date. In real use each status would come from the owning system (for example Entra access packages, the GitHub and Jira APIs, and service desk tickets).

## 5. Buddy view
- **B1 My buddy:** the joiner's profile, why they were matched (shared interests, location, role), and what the buddy can and can't see.
- **B2 Meetups tracker:** meetings so far measured against the Microsoft research (aim for 4–8+ in 90 days), with suggested next topics.
- **B3 Step-in alerts:** e.g. "Priya asked the assistant 3 questions about the comms channels this week: maybe show her around?" The alert comes from the event rather than the content of her questions, to protect privacy. Also a hand-over to the team after Day 30.

## 6. Demo panel (hidden, opened by long-pressing the logo)
- Persona switcher (6 personas) and role switcher (Joiner / Manager / Buddy).
- **Time travel:** jump to Offer, Vetting, Pre-start, Day 1, Week 1 or Day 30.
- **Disruption toggles:** "Slip start date by 2 weeks" (the journey reflows and an empathetic message appears with what changes and what stays the same), "Stall a check" and "Manager on leave" (the deputy takes over).
- Reset demo.

## 7. Demo script (10 minutes on a phone)
1. Margaret receives her offer → warm handover → Today card.
2. Vetting tracker: the regulatory reference is slow and the app explains why honestly → **Slip date** → the journey reshapes itself and the message is reassuring.
3. Switch to Priya and then Rhys: **different packs** for the same day (laptop choice vs shift pattern).
4. Manager view: Priya's manager sets her goals → **the welcome pack lands** in Priya's app.
5. Ask tab: "Can I work from home in my first week?" → a grounded answer with a source → "Can you tell me my manager's salary?" → declines and offers a person.
6. Buddy view: a step-in alert and the meetup tracker.
7. Day 30: pulse → celebration → the manager sees the trend.

## 8. Build order (freeze is 13:00 tomorrow)

| When | Milestone |
|------|-----------|
| Today, by 12:00 (Checkpoint 1) | This plan agreed; repo scaffolded (Vite + MUI + PWA + router + theme) |
| Today 12:00–15:30 | Seed data + journey engine + tests; joiner Today, Journey timeline, Vetting tracker, Choices; demo panel (persona and time) |
| Checkpoint 2 (15:30) | Working joiner journey for the 3 full personas on a phone |
| Today 15:30–17:30 | Assistant (Azure Function + Claude + policies), People tab, manager view M1–M2 with the chain reaction |
| Evening / early tomorrow | Azure deploy, date-slip reflow, buddy view, Day-30 screens, dark mode polish |
| Checkpoint 3 (10:15 tomorrow) | Full demo journey running on a real phone |
| 10:15–12:45 | Playwright smoke test, accessibility pass, README, extra personas, bug fixes |
| **13:00** | **Build freeze**: everything pushed |

Cut if behind, in this order: buddy view B3, personas 4–6 content, J9 chat, M4.

## 9. Quality and judging evidence
- **Tests:** Vitest for the unlock rules, the date-slip reflow and the assistant's refusal and handover logic; one Playwright mobile smoke test of the core path.
- **Accessibility:** MUI defaults plus contrast checks for both themes, 44px touch targets and reduced-motion support.
- **Secrets:** the Claude key lives only in Azure app settings and a local `.env`; `.env.example` is committed with placeholders.
- **README:** team name, what we built, which prompts it answers, what's real vs simulated, how to run it, and the phone URL.

---

## Decisions (agreed 9 Nov)
1. **Persona depth:** 3 in full (Priya, Rhys, Margaret) and 3 lighter (Jordan, Aisha, Sam).
2. **Lloyds logo:** committed to the repo; the team accepted the public-repo trade-off.
3. **Assistant policies:** about 8 short synthetic policies with numbered sections so answers can cite them.
4. **Who builds what:** one stream. Claude builds in the order above, and the team reviews, tests on phones and prepares the pitch.
