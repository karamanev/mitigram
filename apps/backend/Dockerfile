# Build stage — compile NestJS and generate Prisma client
FROM node:20-alpine AS build
WORKDIR /app

# Copy workspace manifests so npm can resolve the monorepo graph
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/backend/package.json      ./apps/backend/

# Install all deps (devDeps needed for nest build + ts-node seed)
RUN npm ci --workspace=apps/backend --workspace=packages/shared

# Copy source
COPY packages/shared ./packages/shared
COPY apps/backend    ./apps/backend

# Generate Prisma client and compile the app
RUN cd apps/backend && npx prisma generate && npm run build

# Runtime stage
FROM node:20-alpine
WORKDIR /app

COPY --from=build /app/node_modules          ./node_modules
COPY --from=build /app/packages              ./packages
COPY --from=build /app/apps/backend/dist     ./apps/backend/dist
COPY --from=build /app/apps/backend/generated ./apps/backend/generated
COPY --from=build /app/apps/backend/prisma   ./apps/backend/prisma
COPY --from=build /app/apps/backend/package.json ./apps/backend/

EXPOSE 3000

# Apply schema, seed once, then start.  All three steps are idempotent.
CMD ["sh", "-c", \
  "cd apps/backend && \
   npx prisma db push --skip-generate && \
   npx ts-node prisma/seed.ts && \
   node dist/main"]
