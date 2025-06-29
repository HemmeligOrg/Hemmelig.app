import { serve } from "@hono/node-server";
import app from "./api/app";
import config from './api/config';

const port = config.get('server.port')!;
console.log(`Server is running on port ${port}`);

serve({
    fetch: app.fetch,
    port,
}); 
