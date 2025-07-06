import db from '../api/lib/db';

async function main() {
    const email = process.argv[2];

    if (!email) {
        console.error('Please provide an email address.');
        process.exit(1);
    }

    try {
        const user = await db.user.findUnique({
            where: { email },
        });

        if (!user) {
            console.error(`User with email "${email}" not found.`);
            process.exit(1);
        }

        await db.user.update({
            where: { email },
            data: { role: 'admin' },
        });

        console.log(`User "${email}" has been granted admin privileges.`);
    } catch (error) {
        console.error('An error occurred:', error);
        process.exit(1);
    } finally {
        await db.$disconnect();
    }
}

main();
