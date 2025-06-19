FROM node:20-bullseye

# Install OpenSSL 1.1 for Prisma compatibility  
RUN apt-get update && apt-get install -y libssl1.1 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy Prisma schema first (needed for postinstall)
COPY prisma ./prisma/

# Install dependencies (this will run prisma generate via postinstall)
RUN npm install

# Copy rest of the source code
COPY . .

# Expose port
EXPOSE 3001

# Start development server
CMD ["npm", "run", "dev"]