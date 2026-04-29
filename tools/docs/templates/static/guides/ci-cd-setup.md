---
id: ci-cd-setup
title: CI/CD Pipeline Setup
sidebar_position: 1
---
# CI/CD Pipeline Setup

How to configure the signageOS CLI for automated pipelines (GitLab CI, GitHub Actions, and other CI/CD tools) where interactive login is not possible.

## Overview

On a **local development machine**, you authenticate by running `sos login`, which interactively prompts for your username and password, generates a personal API security token, and stores it in `~/.sosrc`.

In a **CI/CD pipeline**, there is no interactive terminal. Instead, you generate a long-lived API security token ahead of time and provide it to the pipeline via the `~/.sosrc` configuration file or environment variables.

## Step 1: Generate an API Security Token

Before configuring your pipeline, generate a personal API security token:

1. Log in to [signageOS Box](https://box.signageos.io)
2. Navigate to **Settings** → **Profile** → **API Tkens**
3. Create a new token (account-wide or organization-scoped, depending on your needs)
4. Copy the **Token ID** (identification) and **Token secret** values — you will need both


## Step 2: Configure Authentication

You have two options — choose whichever fits your pipeline best.

### Option A: Configuration File (`~/.sosrc`)

Create the `~/.sosrc` file in the CI runner's home directory with your credentials in INI format:

```ini
apiUrl=https://api.signageos.io
identification=527f75f50ce2f3cxxxxx
apiSecurityToken=7dc58dc275c87283cddf78bc41755cb5f7fxxxxx
```

The file supports the following fields:

| Field | Required | Description |
|-------|----------|-------------|
| `apiUrl` | Yes | signageOS API endpoint (typically `https://api.signageos.io`) |
| `identification` | Yes | Token ID from your security token |
| `apiSecurityToken` | Yes | The security token secret |
| `defaultOrganizationUid` | No | Default organization UID for commands that require one |

> **Security:** The CLI writes this file with permissions `0600` (owner read/write only). Make sure your pipeline step preserves these permissions.

### Option B: Environment Variables

Instead of writing a file, you can set environment variables that override `~/.sosrc` values:

| Environment Variable | Overrides |
|---------------------|-----------|
| `SOS_API_URL` | `apiUrl` |
| `SOS_API_IDENTIFICATION` | `identification` |
| `SOS_API_SECURITY_TOKEN` | `apiSecurityToken` |
| `SOS_ORGANIZATION_UID` | `defaultOrganizationUid` |

Environment variables take precedence over the configuration file, so you can combine both approaches (e.g., a base `.sosrc` with env var overrides for specific jobs).

## Pipeline Examples

### GitLab CI

Store your credentials as [CI/CD variables](https://docs.gitlab.com/ee/ci/variables/) in your project or group settings (masked and protected).

```yaml
# .gitlab-ci.yml

variables:
  SOS_API_URL: "https://api.signageos.io"

stages:
  - deploy

deploy-applet:
  stage: deploy
  image: node:20
  before_script:
    - npm install -g @signageos/cli
    # Write ~/.sosrc from CI/CD variables
    - |
      cat > ~/.sosrc <<EOF
      apiUrl=${SOS_API_URL}
      identification=${SOS_API_IDENTIFICATION}
      apiSecurityToken=${SOS_API_SECURITY_TOKEN}
      EOF
    - chmod 600 ~/.sosrc
  script:
    - sos applet upload
```

Alternatively, using only environment variables (no file needed):

```yaml
deploy-applet:
  stage: deploy
  image: node:20
  variables:
    SOS_API_URL: "https://api.signageos.io"
    # SOS_API_IDENTIFICATION and SOS_API_SECURITY_TOKEN come from CI/CD settings
  before_script:
    - npm install -g @signageos/cli
  script:
    - sos applet upload
```

### GitHub Actions

Store your credentials as [repository secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets).

```yaml
# .github/workflows/deploy.yml

name: Deploy Applet

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install signageOS CLI
        run: npm install -g @signageos/cli

      - name: Configure signageOS credentials
        run: |
          cat > ~/.sosrc <<EOF
          apiUrl=https://api.signageos.io
          identification=${{ secrets.SOS_API_IDENTIFICATION }}
          apiSecurityToken=${{ secrets.SOS_API_SECURITY_TOKEN }}
          EOF
          chmod 600 ~/.sosrc

      - name: Deploy applet
        run: sos applet upload
```

Or using environment variables:

```yaml
      - name: Deploy applet
        env:
          SOS_API_URL: "https://api.signageos.io"
          SOS_API_IDENTIFICATION: ${{ secrets.SOS_API_IDENTIFICATION }}
          SOS_API_SECURITY_TOKEN: ${{ secrets.SOS_API_SECURITY_TOKEN }}
        run: sos applet upload
```

## Using Profiles in CI/CD

If your pipeline needs to operate against multiple signageOS environments (e.g., staging and production), use profiles (see [`sos login`](/cli/login/) documentation):

```ini
[profile staging]
apiUrl=https://api.staging.signageos.io
identification=xxxxxxxxxxxxxxxxxxxx
apiSecurityToken=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

[profile production]
apiUrl=https://api.signageos.io
identification=yyyyyyyyyyyyyyyyyyyy
apiSecurityToken=yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy
```

Then target a specific profile per job:

```bash
# Deploy to staging
sos --profile staging applet upload

# Deploy to production
sos --profile production applet upload
```

You can also select a profile via the `SOS_PROFILE` environment variable:

```bash
export SOS_PROFILE=production
sos applet upload
```

## Setting a Default Organization

Some CLI commands operate on a specific organization. To avoid interactive prompts in CI/CD, set the default organization:

**In `~/.sosrc`:**
```ini
apiUrl=https://api.signageos.io
identification=527f75f50ce2f3cxxxxx
apiSecurityToken=7dc58dc275c87283cddf78bc41755cb5f7fxxxxx
defaultOrganizationUid=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

**Or via environment variable:**
```bash
export SOS_ORGANIZATION_UID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

## Troubleshooting

### "Identification or token is missing"

The CLI cannot find valid credentials. Verify that:
- The `~/.sosrc` file exists and contains both `identification` and `apiSecurityToken`
- Or the `SOS_API_IDENTIFICATION` and `SOS_API_SECURITY_TOKEN` environment variables are set
- The token has not expired or been revoked

### "No API URL is defined"

The CLI needs an API URL. Ensure either:
- `apiUrl` is set in `~/.sosrc`
- Or `SOS_API_URL` environment variable is defined

### "Your authentication token is outdated"

The `identification` value does not match the expected format (20-character hex string). Regenerate the token via [signageOS Box](https://box.signageos.io/settings) or re-run `sos login` on your local machine and copy the new values.

## Security Best Practices

- **Never commit credentials** to your repository. Use CI/CD secret variables or a secrets manager.
- **Use masked variables** in GitLab CI / GitHub Actions so tokens don't appear in job logs.
- **Scope tokens appropriately** — prefer organization-scoped tokens when your pipeline only needs access to a single organization.
- **Rotate tokens periodically** and revoke unused ones via signageOS Box settings.

## See Also

- [`sos login`](/cli/login/) — Interactive authentication for local development
- [Global Options](/cli/) — `--profile` and `--api-url` flags
