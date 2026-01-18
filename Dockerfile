# Use the official Bun image
FROM oven/bun:1

RUN apt-get update && \
    apt-get install -y docker.io && \
    rm -rf /var/lib/apt/lists/*

# Set the working directory
WORKDIR /app

# Copy dependency files first (to cache dependencies)
COPY package.json bun.lock ./

# Install production dependencies
RUN bun install --frozen-lockfile --production

# Copy the rest of your app (index.js)
COPY . .

# Start the application
CMD ["bun", "index.js"]
