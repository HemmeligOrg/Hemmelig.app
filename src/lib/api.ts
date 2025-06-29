import { hc } from 'hono/client';
import type { AppType } from '../../api/app';

const client = hc<AppType>('/api');

export const api = client;
