FROM denoland/deno:2.1.1

WORKDIR /app

# Copy all files
COPY . .

# Build frontend
RUN deno task build

# Create a directory for persistent storage
RUN mkdir -p /data

# Expose port (only needed for accessing the app from host)
EXPOSE 8000

# Set production mode
ENV DENO_ENV=production

# Run the server
CMD ["run", "-A", "--node-modules-dir", "server/main.ts"]
