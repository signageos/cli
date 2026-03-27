FROM node:22-alpine AS runtime

RUN apk add --no-cache file git

WORKDIR /app

FROM runtime AS dev

# Single RUN: install gcompat (glibc compat for bun), enable corepack (yarn/pnpm),
# install bun with cache in /tmp, then wipe /tmp/* to keep the layer small.
RUN apk add --no-cache gcompat \
    && corepack enable \
    && npm install -g --cache /tmp bun \
    && rm -rf /tmp/*

# Entrypoint writes /root/.npmrc with concrete env var values at container
# startup so npm resolves the CodeArtifact registry for the CLI project itself.
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
ENTRYPOINT ["docker-entrypoint.sh"]
