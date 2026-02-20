# LinkedIn Agent

An AI agent that posts daily tech & AI news to LinkedIn, using Claude AI to generate engaging posts from RSS feeds.

## How it works

1. **Fetch** — pulls latest articles from 5 curated tech/AI RSS feeds
2. **Generate** — Claude (claude-sonnet-4-6) writes an engaging LinkedIn post from the top stories
3. **Post** — publishes to LinkedIn via the official REST API
4. **Schedule** — runs automatically every day at 9 AM (configurable)

## Tech Stack

- Runtime: Node.js (CommonJS)
- Package manager: npm
- AI: `@anthropic-ai/sdk` (Claude Sonnet)
- News: `rss-parser`
- LinkedIn: Official REST API v202405 (OAuth 2.0)
- Scheduler: `node-cron`
- HTTP: `axios`

## Project Structure

```
├── index.js                 # Orchestration entry point
├── auth.js                  # One-time OAuth token acquisition
├── src/
│   ├── newsFetcher.js       # RSS → normalized news items
│   ├── postGenerator.js     # Claude API → LinkedIn post text
│   ├── linkedinPoster.js    # LinkedIn REST API → publish
│   └── scheduler.js         # node-cron daily job
├── .env                     # Secrets (never commit)
└── .env.example             # Environment variable template
```

## Setup Guide

### 1. Install dependencies

```bash
npm install
```

### 2. Create your `.env` file

```bash
cp .env.example .env
```

### 3. Get your Anthropic API key

- Go to https://console.anthropic.com/
- Create an API key and add it to `.env` as `ANTHROPIC_API_KEY`

### 4. Create a LinkedIn Developer App

- Go to https://www.linkedin.com/developers/apps
- Create a new app (you need a LinkedIn Company Page)
- Under **Auth** tab → add redirect URL: `http://localhost:3000/callback`
- Under **Products** tab → request access to:
  - "Share on LinkedIn"
  - "Sign In with LinkedIn using OpenID Connect"
- Copy **Client ID** and **Client Secret** into `.env`

### 5. Get your LinkedIn Access Token (run once)

```bash
npm run auth
# or: node auth.js
```

- Open the printed URL in your browser
- Click "Allow" on the LinkedIn consent screen
- Terminal will print your `LINKEDIN_ACCESS_TOKEN` and `LINKEDIN_PERSON_URN`
- Copy both values into `.env`

> Tokens expire in ~60 days. Re-run `node auth.js` when yours expires.

### 6. Test a single run

```bash
npm run run-now
# or: cross-env RUN_NOW=true node index.js
```

This will fetch news, generate a post, and publish it to LinkedIn immediately.

### 7. Start the daily scheduler

```bash
npm start
# or: node index.js
```

Keep the terminal open, or use `pm2` for a persistent background process:

```bash
npm install -g pm2
pm2 start index.js --name linkedin-agent
pm2 save
pm2 startup   # survive reboots
pm2 logs linkedin-agent
```

## Environment Variables

| Variable | Description |
|---|---|
| `LINKEDIN_CLIENT_ID` | From LinkedIn Developer App |
| `LINKEDIN_CLIENT_SECRET` | From LinkedIn Developer App |
| `LINKEDIN_ACCESS_TOKEN` | From `node auth.js` |
| `LINKEDIN_PERSON_URN` | From `node auth.js` (format: `urn:li:person:XXXXX`) |
| `ANTHROPIC_API_KEY` | From Anthropic Console |
| `CRON_SCHEDULE` | Cron expression, default `0 9 * * *` (9 AM daily) |
| `RUN_NOW` | Set to `true` to run immediately instead of scheduling |

## npm Scripts

| Script | What it does |
|---|---|
| `npm start` | Start the scheduler (runs daily at configured time) |
| `npm run auth` | One-time OAuth flow to get LinkedIn credentials |
| `npm run run-now` | Fetch, generate, and post immediately (for testing) |

## Conventions

- Use CommonJS (`require`/`module.exports`) — project is set to `"type": "commonjs"`
- Never commit `.env` — it contains secrets
- The agent uses `Promise.allSettled` for RSS feeds — one failed feed won't crash the run
- LinkedIn posts are plain text only (no markdown) — LinkedIn renders asterisks literally
- Access tokens expire in ~60 days — re-run `node auth.js` to refresh
