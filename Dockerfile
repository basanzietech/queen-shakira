# Dockerfile for Queen Shakira WhatsApp Bot
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the application code
COPY . .

# Expose the port (ensure this matches your app, default 4000)
EXPOSE 4000

# Start the app
CMD ["npm", "start"] 