FROM node:22-bookworm-slim
WORKDIR /app
EXPOSE 3000
CMD ["sh", "-c", "npm ci && npm run dev -- -H 0.0.0.0 -p 3000"]
