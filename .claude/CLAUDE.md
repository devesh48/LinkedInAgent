# LinkedIn Agent

This is a Node.js project for an AI-powered LinkedIn Agent.

## Project Overview

An AI agent that automates or assists with LinkedIn-related tasks such as profile management, outreach, and engagement.

## Tech Stack

- Runtime: Node.js (CommonJS)
- Package manager: npm

## Development

Install dependencies:
```bash
npm install
```

Run the agent:
```bash
node index.js
```

## Conventions

- Use CommonJS (`require`/`module.exports`) — the project is set to `"type": "commonjs"`
- Keep secrets and credentials out of source files; use environment variables or a `.env` file (never commit `.env`)
- Entry point is `index.js`
