import { PrismaClient } from '@prisma/client';
import adminSettings from '../adminSettings.js';

const prisma = new PrismaClient();

export default prisma;
