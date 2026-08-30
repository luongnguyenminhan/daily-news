FROM node:22-alpine
WORKDIR /repo

COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/package.json
COPY apps/api/package.json apps/api/package.json
RUN npm ci

COPY . .
RUN npm run build --workspace=web

WORKDIR /repo/apps/web
EXPOSE 3000
CMD ["npm", "start"]
