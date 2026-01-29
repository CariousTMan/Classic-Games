# Dockerfile
# Build stage
FROM node:20-alpine AS build
WORKDIR /app

# Install build dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS prod
WORKDIR /app

# Copy package files and install only production deps
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built artifacts from build stage
COPY --from=build /app/dist ./dist

# Copy any other runtime files you need (public, attached_assets, etc.)
COPY --from=build /app/attached_assets ./attached_assets

ENV NODE_ENV=production
EXPOSE 8080
CMD ["node", "dist/index.cjs"]