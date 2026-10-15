## Advanced Usage

### Organization scope

| Login type | How the organization is chosen |
|---|---|
| `sos login` (Auth0) | `--organization-uid`, else `defaultOrganizationUid` from `~/.sosrc`, appended as `organizationUid=` query parameter |
| `SOS_API_IDENTIFICATION` + `SOS_API_SECURITY_TOKEN` | Carried by the credentials; no query parameter is sent |

Use `--no-default-organization` for account-level endpoints such as `/v1/organization`.

### Write safety

`GET` is the default. `POST`, `PUT` and `DELETE` require `--confirm-write` on each invocation and print the opt-in to stderr. Review the organization, target and body first: writes can change or permanently delete data. The flag is not proof of human approval or a substitute for server permissions. Use least-privilege credentials; agents must ask for explicit approval before supplying it.

### Request bodies

`--data` takes inline JSON or `@file.json` and is rejected for `GET`. On Windows prefer the file form: shells there mangle inline quotes.

```bash
echo '{"devicePowerAction":"APPLET_RELOAD"}' > action.json
sos api --method POST --confirm-write --path /v1/device/<deviceUid>/power-action --data @action.json
```

### Git Bash on Windows

Git Bash rewrites arguments starting with `/` into Windows paths, so `--path /v2/device` arrives as `C:/Program Files/Git/v2/device` and is rejected. Disable the conversion for the call:

```bash
MSYS_NO_PATHCONV=1 sos api --path /v2/device
```

### Reading the result

stdout is the response body only, so it can be piped to `jq` or parsed by a script. Progress, warnings and the update notice go to stderr. Exit code 1 means the API answered with a non-2xx status; the body is still printed.

### Related commands

- [`sos device power-action`](../device/power-action/) - reboot, reload and other power actions without writing JSON
- [`sos device set-content`](../device/set-content/) - assign an applet with a default timing
- [`sos skill install`](../skill/install/) - install the agent skill that uses this command
