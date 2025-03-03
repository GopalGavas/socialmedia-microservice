# Use an official Node.js image
FROM node:18-alpine

# Set the working directory
WORKDIR /usr/src/app

# Copy only package.json and package-lock.json first for better caching
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy the remaining application files
COPY . .

# Expose the application port
EXPOSE 8000

# Use entrypoint to allow additional parameters
CMD [ "npm", "start" ]