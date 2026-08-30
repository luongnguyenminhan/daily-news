FROM node:22-alpine
RUN apk add --no-cache openssl
WORKDIR /repo

COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/package.json
COPY apps/api/package.json apps/api/package.json
RUN npm ci

COPY . .
RUN npm exec --workspace=api -- prisma generate
RUN npm run build --workspace=api

WORKDIR /repo/apps/api
EXPOSE 3001
CMD ["npm", "run", "start:prod"]
