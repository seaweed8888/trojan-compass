FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json tsconfig.base.json ./
COPY server/package.json server/package.json
COPY shared/typescript/package.json shared/typescript/package.json
COPY web/package.json web/package.json
COPY demos/usc-map/package.json demos/usc-map/package.json
RUN npm ci --workspace=@trojan-compass/api --workspace=@trojan-compass/shared --include-workspace-root
COPY server server
COPY shared shared
RUN npm run build --workspace=@trojan-compass/api

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=4000 DATASET_MODE=files DATASET_ROOT=/data
COPY package.json package-lock.json ./
COPY server/package.json server/package.json
COPY shared/typescript/package.json shared/typescript/package.json
COPY web/package.json web/package.json
COPY demos/usc-map/package.json demos/usc-map/package.json
RUN npm ci --workspace=@trojan-compass/api --workspace=@trojan-compass/shared --omit=dev --ignore-scripts && npm cache clean --force
COPY --from=build /app/server/dist server/dist
COPY shared/contracts shared/contracts
USER node
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s CMD node -e 'fetch("http://127.0.0.1:4000/api/health",{signal:AbortSignal.timeout(2000)}).then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))'
CMD ["node", "server/dist/server.js"]
