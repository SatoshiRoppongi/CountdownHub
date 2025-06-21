#!/bin/bash

# Production deployment script for Render
echo "🚀 Starting production deployment..."

# Generate Prisma client
echo "📦 Generating Prisma client..."
npx prisma generate

# Push database schema
echo "🗃️ Pushing database schema..."
npx prisma db push --accept-data-loss

# Seed database if tables are empty
echo "🌱 Checking if database needs seeding..."
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAndSeed() {
  try {
    const eventCount = await prisma.event.count();
    if (eventCount === 0) {
      console.log('Database is empty, running seed...');
      const { execSync } = require('child_process');
      execSync('npx prisma db seed', { stdio: 'inherit' });
    } else {
      console.log(\`Database already has \${eventCount} events, skipping seed.\`);
    }
  } catch (error) {
    console.log('Database tables not ready, skipping seed check.');
  } finally {
    await prisma.\$disconnect();
  }
}

checkAndSeed();
"

echo "✅ Database setup completed!"