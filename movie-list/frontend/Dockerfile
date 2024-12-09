# Use a Node.js image
FROM node:16

# Set the working directory
WORKDIR /app

# Change ownership to the `node` user
RUN chown -R node:node /app

# Switch to the `node` user
USER node

# Copy the package.json and package-lock.json
COPY --chown=node:node package*.json ./

# Install dependencies
RUN npm install

# Copy application files
COPY --chown=node:node . .

# Build the Svelte app
RUN npm run build
# Expose the port and define the start command
EXPOSE 8080
CMD ["npm", "start"]
