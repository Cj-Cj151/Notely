require('dotenv/config');

const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('../generated/prisma/client.ts');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error('DATABASE_URL must be set to initialize Prisma Client.');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

module.exports = prisma;
