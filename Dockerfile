# Dockerfile for ChainCacao relayer + server
FROM node:20-alpine

# Create app directory
WORKDIR /app

# Install dependencies (including dev for tsx)
COPY package.json package-lock.json* ./
RUN npm ci --no-progress --silent

# Copy source
COPY . .

# Expose server port
EXPOSE 3001

# Use production env
ENV NODE_ENV=production

# Start the server using tsx (installed from devDeps)
CMD ["npx", "tsx", "server.ts"]
