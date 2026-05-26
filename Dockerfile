FROM node:20-alpine AS builder

WORKDIR /app

COPY client/package*.json client/
RUN cd client && npm ci

COPY client/ client/
RUN cd client && npm run build

FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache dumb-init

COPY server/package*.json server/
RUN cd server && npm ci --omit=dev

COPY server/ server/
COPY --from=builder /app/client/dist /app/client/dist

EXPOSE 3001

ENV NODE_ENV=production

CMD ["dumb-init", "node", "server/src/server.js"]
