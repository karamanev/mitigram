# Build stage — produce the Angular static bundle
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/shared/package.json  ./packages/shared/
COPY apps/frontend/package.json     ./apps/frontend/

RUN npm ci --workspace=apps/frontend --workspace=packages/shared

COPY packages/shared ./packages/shared
COPY apps/frontend   ./apps/frontend

RUN cd apps/frontend && npm run build

# Runtime stage — serve via nginx
FROM nginx:1.27-alpine
COPY --from=build /app/apps/frontend/dist/frontend/browser /usr/share/nginx/html
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
