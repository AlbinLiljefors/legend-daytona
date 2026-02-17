# Legend Viewer — Static build served via lightweight HTTP server
# Multi-stage: build with Node, serve with nginx

# ── Build stage ──
FROM node:20-slim AS build

WORKDIR /app

# Install dependencies first (for layer caching)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# ── Serve stage ──
FROM nginx:alpine

# Copy built assets
COPY --from=build /app/dist /usr/share/nginx/html

# Custom nginx config for SPA routing
RUN printf 'server {\n\
    listen 8080;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
\n\
    # SPA fallback — serve index.html for all routes\n\
    location / {\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
\n\
    # Cache static assets\n\
    location /assets/ {\n\
        expires 1y;\n\
        add_header Cache-Control "public, immutable";\n\
    }\n\
\n\
    # Generated JSON data (may be updated at runtime)\n\
    location /generated/ {\n\
        expires off;\n\
        add_header Cache-Control "no-cache";\n\
    }\n\
}\n' > /etc/nginx/conf.d/default.conf

# Run as non-root user (port 8080 > 1024, no root needed)
RUN chown -R nginx:nginx /usr/share/nginx/html /var/cache/nginx /var/log/nginx /etc/nginx/conf.d \
    && touch /run/nginx.pid && chown nginx:nginx /run/nginx.pid
USER nginx

EXPOSE 8080
