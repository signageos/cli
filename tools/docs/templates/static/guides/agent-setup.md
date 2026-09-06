---
id: agent-setup
title: AI Agent Setup
sidebar_position: 2
---
# AI Agent Setup

Let an AI coding agent (Claude Code, GitHub Copilot CLI, Cursor, Codex) operate your signageOS screens: find devices, check status, take screenshots, reboot or reload, put an applet on a screen, diagnose a screen that shows the wrong thing.

## One-time setup

You need Node.js 20 or newer ([nodejs.org](https://nodejs.org/)). Then paste this into your agent:

> Set up signageOS for me: run `npx @signageos/cli skill install` and follow what it prints.

The command installs the `signageos` skill into every supported agent found on your machine. The first time you use it, the agent runs a preflight: it checks Node and the CLI, and when you are not logged in it runs `sos login`, which prints a URL and a short code for you to confirm in the browser. No password ever passes through the agent.

## What the agent can do

| You say | The agent runs |
|---|---|
| "Which screens are in the Prague store?" | `sos api --path "/v2/device?search=Prague"` |
| "Is the lobby screen online? What does it show?" | device status, `sos timing list`, a screenshot |
| "Reload all screens in the Prague store" | shows the list, waits for your yes, `sos device power-action --type reload` per device |
| "Put the menu applet on the lobby screen" | a confirmed timing with the exact applet version and your configuration |
| "The lobby screen is blank" | the diagnose runbook: status, screenshot, reload, restart, hand-over for support |

## Statistics and analytics

Use the analytics views in Box for fleet-wide statistics rather than fetching every device through REST. `sos api` is a REST command; the separate analytics GraphQL service uses Bearer-token authentication and is not currently exposed by a `sos graphql` command.

## Safety

- The agent acts as you, with your Box permissions, in the organization you set as default (`sos organization set-default`).
- Never share tokens in prompts or ask the agent to read credentials. [`sos api`](../api/) uses the saved login and sends its credentials only to your configured API URL.
- Review every change and explicitly approve it. REST writes require `--confirm-write`; the flag records opt-in, not proof of human approval. An agent can make mistakes, and writes can permanently change data. Use least-privilege credentials; the CLI does not make your token read-only.
- Deleting anything stays in Box.

## Updating

After `npm install -g @signageos/cli@latest`, run `sos skill install` again so the skill matches the CLI.
