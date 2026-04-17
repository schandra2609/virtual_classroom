/**
 * @file database.config.ts
 * @module Config/Database
 * @description This module initializes and exports a singleton instance of the Prisma Client.
 * It is responsible for orchestrating the connection between the Node.js backend and the
 * PostgreSQL database.
 * @author Sayan Chandra
 */
import { PrismaClient } from "../../generated/prisma/client.ts";
import { ENV_CONFIG } from "./env.config.ts";

/**
 * @description To prevent connection exhaustion in development (due to hot-reloading),
 * we attach the Prisma instance to the global object. This ensures that even when
 * the server restarts, the existing database connection pool is reused.
 */
const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

/**
 * @constant prisma
 * @type {PrismaClient}
 * @description The centralized Prisma Client instance.
 * Configuration Details:
 * - **Datasource**: Uses the Pooled URL for standard queries.
 * - **Logging**:
 *    - `development`: Verbose logging (query, info, warn, error) for debugging.
 *    - `production`: Minimal logging (warn, error) to protect performance and privacy.
 */
export const prisma: PrismaClient =
    globalForPrisma.prisma ??
    new PrismaClient({
        datasources: {
            db: { url: ENV_CONFIG.DATABASE.URL as string },
        },
        log:
            ENV_CONFIG.NODE_ENV === "development"
                ? ["query", "info", "warn", "error"]
                : ["warn", "error"],
    });

// Save to global object if not in production to maintain the Singleton pattern
if (ENV_CONFIG.NODE_ENV !== "production") globalForPrisma.prisma = prisma;