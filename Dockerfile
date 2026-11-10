# Node's official Debian image supports linux/arm64 and linux/amd64.
# Coolify/BuildKit selects the target architecture; never copy host node_modules.
FROM node:22-bookworm-slim AS build
WORKDIR /app
ENV CI=true
COPY package.json package-lock.json .npmrc ./
RUN npm install -g npm@11 && npm ci --include=dev --no-audit --no-fund
COPY client ./client
COPY server ./server
COPY shared ./shared
COPY attached_assets ./attached_assets
COPY vite.config.ts tailwind.config.ts postcss.config.js tsconfig.json ./
RUN npm run build && npm prune --omit=dev --no-audit --no-fund

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production PORT=5000
COPY --from=build --chown=node:node /app/package.json /app/package-lock.json ./
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
RUN mkdir -p uploads writing_samples && chown -R node:node uploads writing_samples
USER node
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:'+(process.env.PORT||5000)+'/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]
CMD ["npm", "run", "start"]
