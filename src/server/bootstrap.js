import config from 'config';
import { PrismaClient } from '@prisma/client';
import { hash } from './helpers/password.js';

const prisma = new PrismaClient();

const username = config.get('account.root.user');
const email = config.get('account.root.email');
const password = config.get('account.root.password');

// Create a root user the first time the server is running
(async function createRootUser() {
    const rootUser = await prisma.user.findFirst({
        where: { username },
    });

    if (rootUser) {
        return;
    }

    await prisma.user.create({
        data: {
            username,
            email,
            password: await hash(password),
            generated: true,
        },
    });
})();
