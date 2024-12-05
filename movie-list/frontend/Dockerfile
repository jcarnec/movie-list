# Use the Node.js base image
FROM node:16

# Set a non-root user
USER node

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY --chown=node:node package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application files
COPY --chown=node:node . .

# Build the Svelte app
RUN npm run build

# Expose the port the app runs on
EXPOSE 8080

# Command to run the app
CMD ["npm", "run", "dev"]
