FROM node:18

# Install required packages for Prisma
RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npx prisma generate

EXPOSE 3001

CMD ["npm", "run", "dev"]