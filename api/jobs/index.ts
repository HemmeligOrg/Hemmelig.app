import { Cron } from 'croner';
import { deleteExpiredSecrets, deleteOrphanedFiles } from './expired';

// https://crontab.guru
export default function startJobs() {
    // This function can be used to start any other jobs in the future
    console.log('Job scheduler initialized.');

    // Running every minute
    new Cron('* * * * *', async () => {
        await deleteExpiredSecrets();
        await deleteOrphanedFiles();
    });
}
