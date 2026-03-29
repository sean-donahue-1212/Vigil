# Vigil

**Vigil watches your customer accounts continuously, detects churn signals using rule-based scoring, and autonomously sends a personalized save email before any human notices the account is at risk.**

> "Vigil noticed this account was dying 6 weeks before renewal. It sent the email. Nobody asked it to."

---

## What it does

- Loads 8 fake CRM accounts and scores each one for churn risk (0–100) using signals: login gaps, unresolved tickets, seat downgrades, low NPS, and days until renewal
- Sorts accounts by risk — critical and high glow red in the sidebar
- **Automatically drafts and sends save emails** for all critical and high-risk accounts on load
- Lets you preview, edit, and manually send emails for any account
- Sent emails persist per account — navigate away and come back, the confirmation is still there

---

## Tech stack

| Layer | Tech |
|-------|------|
| Frontend | React + TypeScript + Tailwind CSS, Vite |
| Backend | Node.js + Express + ts-node |
| AI (drafting) | Groq API — `llama-3.3-70b-versatile` |
| Fonts | DM Sans, Syne, DM Mono (Google Fonts) |

---

## Prerequisites

- Node.js 18+
- A free [Groq API key](https://console.groq.com) (takes 30 seconds)

---

## Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd Vigil
npm install
```

### 2. Create `.env`

```bash
cp .env.example .env
```

Open `.env` and add your Groq API key:

```
GROQ_API_KEY=gsk_...
```

Get one free at [console.groq.com](https://console.groq.com) → API Keys → Create new key.

### 3. Run

Open two terminals:

```bash
# Terminal 1 — backend (port 3333)
npm run dev:server

# Terminal 2 — frontend (port 5173)
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173).

---

## Demo walkthrough

1. **Open the app** — 8 accounts load instantly, sorted by churn risk. The 2 critical accounts pulse red.
2. **Watch the auto-send** — critical and high-risk accounts are automatically drafted and sent in the background on load. Their email panels fill in as they complete.
3. **Click any account** — see the full signal breakdown: last login, open tickets, seat downgrade, NPS, renewal date.
4. **Click "Preview email"** on a medium or low account — Groq drafts a personalized save email with proper greeting and sign-off.
5. **Edit the draft** — click any field (To, Subject, or body) to edit before sending.
6. **Send** — hit "Send save email". The sent confirmation locks in and persists.

---

## Project structure

```
Vigil/
  src/
    types/index.ts              — data models
    lib/churnScorer.ts          — rule-based scoring (0–100)
    lib/accounts.ts             — loads seed CRM data
    components/
      AccountList.tsx           — sidebar, sorted by risk
      AccountCard.tsx           — signal breakdown + action buttons
      EmailPreview.tsx          — editable draft + sent confirmation
      RiskBadge.tsx             — critical / high / medium / low badge
      WatchdogStatus.tsx        — scanning indicator
    App.tsx                     — state, auto-send logic
  server/
    index.ts                    — Express proxy to Groq API
  seed/
    accounts.json               — 8 fake CRM accounts
```

## Churn scoring

| Signal | Points |
|--------|--------|
| Last login > 14 days | +25 |
| Last login > 30 days | +40 |
| Unresolved tickets ≥ 2 | +20 |
| Unresolved tickets ≥ 4 | +35 |
| Seat downgrade last month | +25 |
| Seat utilization < 50% | +15 |
| NPS < 6 | +20 |
| Renewal < 60 days away | +10 |

Risk levels: **0–24** low · **25–49** medium · **50–74** high · **75+** critical
