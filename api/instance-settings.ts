import prisma from './lib/db';

const settings = new Map();

settings.set('instanceSettings', await prisma.instanceSettings.findFirst());

export default settings;
