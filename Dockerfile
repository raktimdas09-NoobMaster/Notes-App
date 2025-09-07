FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json & package-lock.json (if available)
COPY App/package.json ./

# Install dependencies
RUN npm install

# Copy the rest of the app
COPY App/ .

# Expose port
EXPOSE 5050

# Start the app
CMD ["node", "server.js"]
