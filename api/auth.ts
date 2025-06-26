import { betterAuth } from "better-auth";
import { username } from "better-auth/plugins"
import { prismaAdapter } from "better-auth/adapters/prisma";
// If your Prisma file is located elsewhere, you can change the path
import prisma from "./lib/db";
export const auth = betterAuth({
    //basePath: "/api/v1",
    database: prismaAdapter(prisma, {
        provider: "sqlite", // or "mysql", "postgresql", ...etc
    }),
    emailAndPassword: {
        enabled: true
    },
    socialProviders: {
        /* github: {
             clientId: process.env.GITHUB_CLIENT_ID as string,
             clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
         },*/
    },
    plugins: [
        username()
    ],
    trustedOrigins: [
        "http://localhost:5173",
        "https://hemmelig.app"
    ]
});
