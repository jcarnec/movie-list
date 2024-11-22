FROM node:16

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Build the Svelte app
RUN npm run build

# Expose port
EXPOSE 8080

# Start the app
CMD ["npm", "run", "dev"]

