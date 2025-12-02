import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { username, admin } from "better-auth/plugins"
import { prismaAdapter } from "better-auth/adapters/prisma";
// If your Prisma file is located elsewhere, you can change the path
import prisma from "./lib/db";
import config from "./config";

export const auth = betterAuth({
    //basePath: "/api/v1",
    database: prismaAdapter(prisma, {
        provider: "sqlite", // or "mysql", "postgresql", ...etc
    }),
    emailAndPassword: {
        enabled: true,
    },
    socialProviders: {
        /* github: {
             clientId: process.env.GITHUB_CLIENT_ID as string,
             clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
         },*/
    },
    plugins: [
        username(),
        admin()
    ],
    trustedOrigins: config.get('trustedOrigins'),
    hooks: {
        before: async (context) => {
            // Only apply email domain validation to sign-up
            if (context.path !== "/sign-up/email") {
                return;
            }

            const body = context.body as { email?: string };
            const email = body?.email;
            
            if (!email) {
                return;
            }

            // Get instance settings for allowed email domains
            const settings = await prisma.instanceSettings.findFirst({
                select: { allowedEmailDomains: true }
            });

            const allowedDomains = settings?.allowedEmailDomains?.trim();
            
            // If no domains configured, allow all
            if (!allowedDomains) {
                return;
            }

            // Parse comma-separated domains
            const domains = allowedDomains
                .split(',')
                .map(d => d.trim().toLowerCase())
                .filter(d => d.length > 0);

            if (domains.length === 0) {
                return;
            }

            // Extract domain from email
            const emailDomain = email.split('@')[1]?.toLowerCase();

            if (!emailDomain || !domains.includes(emailDomain)) {
                throw new APIError("FORBIDDEN", {
                    message: "Email domain not allowed"
                });
            }
        }
    }
});
