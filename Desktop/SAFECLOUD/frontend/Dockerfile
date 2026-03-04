FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy project
COPY . .

# Build Next.js
RUN npm run build

# Start app
CMD ["npm", "start"]
