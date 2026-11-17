
FROM node:24-alpine AS build

WORKDIR /app

COPY backend/package.json backend/package-lock.json ./
RUN npm ci

COPY backend/prisma ./prisma
COPY backend/prisma7.config.ts ./prisma7.config.ts

RUN npm exec prisma generate
RUN printf '{"type":"module"}\n' > ./generated/prisma/package.json

FROM node:24-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY backend/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/generated ./generated
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma7.config.ts ./prisma7.config.ts
COPY backend/lib ./lib
COPY backend/server.js ./server.js

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
