FROM node:24-alpine

ENV NODE_ENV=production
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --chown=node:node app.js ./

USER node
EXPOSE 8080

CMD ["npm", "start"]
