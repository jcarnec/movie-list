# Use a Node.js base image
FROM node:16-alpine

# Set the working directory
WORKDIR /express-server

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Expose the port the server runs on
EXPOSE 3000

# Define the command to run the application
CMD ["npm", "run", "dev"]

