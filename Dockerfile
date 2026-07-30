FROM node:24-alpine

ENV NODE_ENV=production
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --chown=node:node app.js server.js ./
COPY --chown=node:node public ./public

USER node
EXPOSE 8080

CMD ["npm", "start"]
