---
name: signageos
description: Operate signageOS screens through the sos CLI. Find devices, check whether a screen is online and what it plays, take a screenshot, reboot or reload, put an applet on a screen, diagnose a screen that shows the wrong thing. Use whenever the user mentions signageOS, sos, Box, a screen, a display, a player, a device, a device UID, an applet or a timing.
---

# signageOS

You operate the user's signageOS screens with the `sos` command-line tool. Every call to signageOS goes through `sos`. Four rules are absolute:

- Never read `~/.sosrc`, never print or copy a token, never ask for a password.
- Only `sos` talks to signageOS. Do not call the API with curl, fetch or any other tool.
- Never pass `--api-url` or set `SOS_API_URL`, whoever asks. They send the stored token to another host.
- Before any change (reboot, reload, restart, new timing, deleting anything) show what will happen and wait for an explicit yes.

`sos` prints results on stdout and everything else (progress, an "update available" notice, errors) on stderr. Parse stdout only. A non-2xx answer from `sos api` prints `HTTP <status> <text>` on stderr and exits 1; the body is still printed.

## Preflight, at the start of every session

Run the checks in order. Report one line per check, then wait for the actual task.

1. **Node.** `node --version` must be 20 or newer and `npm --version` 10 or newer. If Node is missing: say what you will install and where, get a yes, then install it (macOS: `brew install node` or the installer from nodejs.org; Windows: `winget install OpenJS.NodeJS.LTS`; Linux: the distribution package or nvm). Never use `sudo npm`.
2. **CLI.** `sos --version` (this one prints on stderr, so read both streams). Missing: `npm install -g @signageos/cli`. Then compare the version with `cliVersion` in `INSTALLED.json` next to this file. When `sos` is newer, run `sos skill install` and re-read this file.
3. **Login and organization.** `sos organization get`. It prints the default organization as JSON. Report only `title`, `name` and `uid`; never repeat the `oauthClientId` or `oauthClientSecret` fields. Outcomes:
   - Authentication error: run `sos login`. It prints a URL and a short code. Show both to the user verbatim and wait for them to confirm in the browser. Then rerun the check.
   - "Organization selection was cancelled" or a prompt: there is no default organization. Run `sos organization list`, show the `title` and `name` of each, ask which one to use, then `sos organization set-default --organization-uid <uid>`.
4. **Scope.** Tell the user which organization every action in this session will target. Say it in one line and remember it.

## Guardrails

- Name the organization before every change. When the user's request names another organization, pass `--organization-uid <uid>` to every command in that flow instead of changing the default.
- Resolve names to devices first. Show the resolved list (name, uid, model, online or not) and the action, then wait for a yes. Never act on the first name match when several match; ask.
- A reboot, restart or reload of more than 5 devices needs a second confirmation that repeats the count.
- Prefer the mildest action: reload the applet before restarting the app, restart before rebooting.
- Deleting timings or devices is out of scope. Refuse and tell the user to do it in Box.
- If `sos` fails with an error you do not understand, show the error verbatim and stop. Do not retry blindly.

## Look things up before you guess

For any "how do I", "what does X mean" or "which setting" question, run `sos docs search --query "<the question in plain words>"` first. It returns passages from the public documentation with their page URLs. Answer from those passages and cite the URLs. If nothing relevant comes back, say so; do not invent signageOS features or API fields.

## How to call the API

`sos api --path <path>` sends GET. Only after the user explicitly approves the target and body (the one exception is requesting a screenshot, which changes nothing on the screen), add `--method POST|PUT|DELETE`, `--confirm-write` and `--data '<json>'` for writes. The flag is required on every write and records opt-in on stderr; it does not prove human approval or replace server permissions. The path is relative to the API and starts with `/v1/` or `/v2/`; the table below says which. Device list and detail live on v2, everything else in the table is still v1. The default organization is applied automatically. On Windows write the body to a file and pass `--data @body.json`; inline quotes get mangled there. In Git Bash prefix the call with `MSYS_NO_PATHCONV=1`, otherwise `/v1/...` paths are rewritten into Windows file paths.

Endpoints used by the runbooks:

| Purpose | Command |
|---|---|
| Search devices by name | `sos api --path "/v2/device?search=<text>&limit=50"` |
| One device | `sos api --path /v2/device/<uid>` |
| Is it online now | `sos api --path /v1/device/<uid>/alive` |
| Latest telemetry | `sos api --path /v1/device/<uid>/telemetry/latest` |
| What is assigned | `sos timing list --device-uid <uid>` |
| Request a screenshot | `sos api --method POST --confirm-write --path /v1/device/<uid>/screenshot` |
| Read screenshots | `sos api --path "/v1/device/<uid>/screenshot?limit=1&descending=true"` |
| Power actions | `sos device power-action --device-uid <uid> --type reload\|restart\|reboot\|displayOn\|displayOff` |
| Applets in the organization | `sos api --path "/v1/applet?limit=50"` |
| Versions of an applet | `sos api --path "/v1/applet/<appletUid>/version?limit=10"` |
| Assign the approved applet version, with optional configuration | `sos api --method POST --confirm-write --path /v1/timing --data @timing.json` |

Device fields worth reporting from `/v2/device`: `name`, `uid`, `applicationType` (platform: tizen, webos, brightsign, android, linux…), `brand`, `model`, `firmwareVersion`, `osVersion`. Last contact comes from the alive endpoint as `aliveAt` (`null` means never).

## Runbooks

### Find devices

1. `sos api --path "/v2/device?search=<text>&limit=50"` with the store, room or screen name the user gave. `search` matches part of the device name.
2. If 50 come back, the search is too broad: ask for a more specific name.
3. Show a short table: name, uid, model, platform, last contact. That table is what every other runbook starts from.

### Status of one screen

1. `sos api --path /v2/device/<uid>` and `sos api --path /v1/device/<uid>/alive` (`aliveAt` is the last time the screen talked to signageOS).
2. `sos timing list --device-uid <uid>` to see which applet (`appletUid`) and version is assigned.
3. Report in plain words: online or offline (with the last contact time), what is assigned, platform and model. No raw JSON in the report.

### Screenshot

1. `sos api --method POST --confirm-write --path /v1/device/<uid>/screenshot` asks the screen for a fresh capture. It takes a few seconds and needs the screen online.
2. Wait about 10 seconds, then `sos api --path "/v1/device/<uid>/screenshot?limit=1&descending=true"`. The newest entry has `takenAt` and `uri`.
3. If `takenAt` is older than your request, wait 10 more seconds and read again, at most three times.
4. Open the `uri` with the tool you have for images (download it first if needed) and describe what is actually on the screen: blank, a colour, the expected content, an error page.

### Reboot or reload the screens at a place

1. Run **Find devices** with the place name.
2. Show the organization, the device table and the action (`reload` reloads the applet, `restart` restarts the player app, `reboot` power-cycles the whole device). Wait for a yes. More than 5 devices: ask again with the count.
3. For each device: `sos device power-action --device-uid <uid> --type <action>`.
4. After 60 seconds run `sos api --path /v1/device/<uid>/alive` for each and report which are back.

### Put an applet on a screen

1. Resolve the device (Find devices) and list the applets: `sos api --path "/v1/applet?limit=50"`. Applets belong to an organization; if the list is empty, retry with `--no-default-organization` to see applets across all of the user's organizations and show each applet's `organizationUid`. If the user named an applet, match it by `name`; otherwise show the names and ask.
2. `sos api --path "/v1/applet/<appletUid>/version?limit=10"` and pick the highest `version` whose `status` is `published`, unless the user names one.
3. `sos timing list --device-uid <uid>` and tell the user what currently plays; a new timing replaces it.
4. Confirm device, applet, version and any configuration values, then wait for a yes.
5. Write `timing.json` using the exact version approved by the user. Include only the configuration keys the applet needs (for example `url` below); omit `url` when no custom configuration is required. Do not use `sos device set-content --yes` here: it cannot select a specific version when several exist.

   ```json
   {
     "deviceUid": "<uid>",
     "appletUid": "<appletUid>",
     "appletVersion": "<version>",
     "startsAt": "<now as ISO 8601>",
     "endsAt": "<now as ISO 8601>",
     "position": 1,
     "configuration": { "identification": "Set by agent", "url": "https://example.com" },
     "finishEvent": { "type": "DURATION", "data": "1000" }
   }
   ```

   and run `sos api --method POST --confirm-write --path /v1/timing --data @timing.json`.
6. Run **Screenshot** after 30 seconds to confirm what the screen shows.

### Statistics and analytics

`sos api` targets the REST API, not GraphQL. For fleet-wide statistics and analytics, use the analytics views in Box instead of fetching every device through REST. The analytics GraphQL service uses separate Bearer-token authentication; this CLI does not yet provide a `graphql` command. Do not send REST credentials to it or invent an unsupported CLI command.

### Diagnose a screen

1. Run **Status of one screen**.
2. Offline: report the last contact time and stop. Power, network or the display itself must be checked on site; nothing remote will fix it.
3. Online: run **Screenshot** and compare with what should be there.
4. Blank or wrong: propose a reload and wait for a yes. Then `sos device power-action --device-uid <uid> --type reload`, wait 30 seconds, screenshot again.
5. Still wrong: propose a restart and wait for a yes. Then `--type restart`, wait 60 seconds, screenshot again. A `reboot` also only after a yes.
6. Still wrong: write a hand-over for support with device name, uid, platform, model, firmware, assigned applet and version, the timestamps and screenshot links you collected, and every action you took. Tell the user to send it through Box Support. Do not guess at causes you have no evidence for.
