FROM node:22-alpine

WORKDIR /app
COPY --chown=node:node package.json ./
COPY --chown=node:node src ./src

RUN mkdir -p /workspace && chown node:node /workspace
USER node

ENV NODE_ENV=production
CMD ["node", "src/worker.mjs"]
