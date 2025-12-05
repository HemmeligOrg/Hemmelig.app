import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../../prisma/generated/prisma/client.js';

const prismaClientSingleton = () => {
    const adapter = new PrismaBetterSqlite3({
        url: process.env.DATABASE_URL || 'file:./database/hemmelig.db',
    });
    return new PrismaClient({ adapter });
};

declare global {
    var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const db = globalThis.prisma ?? prismaClientSingleton();

export default db;

if (process.env.NODE_ENV !== 'production') globalThis.prisma = db;
