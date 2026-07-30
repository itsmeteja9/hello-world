FROM node:24.18.1-alpine3.24

ENV NODE_ENV=production
WORKDIR /app

# npm 11.19.0 contains patched undici 6.27.0
RUN npm install --global npm@11.19.0

COPY package*.json ./
RUN npm ci --omit=dev \
    && npm cache clean --force

COPY --chown=node:node app.js server.js ./
COPY --chown=node:node public ./public

USER node
EXPOSE 8080

CMD ["node", "server.js"]