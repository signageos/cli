#!/bin/sh
set -e

# Strip trailing slash from NPM_REGISTRY_HOST so the _authToken key matches.
registry_host="${NPM_REGISTRY_HOST%/}"

# Write /root/.npmrc with concrete env var values.
# This is needed for the CLI project's own npm install, where the project-level
# .npmrc uses registry=${NPM_REGISTRY_URL} (npm substitutes env vars at runtime).
#
# We intentionally do NOT write .yarnrc or .bunfig.toml here.  The generated
# applet projects have their own .npmrc pointing to https://registry.npmjs.org/
# and all @signageos/* packages are public — no private registry needed.
cat > /root/.npmrc << EOF
@signageos:registry=${NPM_REGISTRY_URL}
//${registry_host}/:_authToken=${NPM_AUTH_TOKEN}
always-auth=true
EOF

exec "$@"
