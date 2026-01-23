/**
 * @file database.config.ts
 * @module Config/Database
 * @description Configures the Prisma Client to interact with the PostgreSQL database.
 * Implements a singleton pattern to prevent connection exhaustion during development reloads.
 */
import { PrismaClient } from "../../generated/prisma/client.ts";
import { ENV_CONFIG } from "./env.config.ts";

/**
 * @constant prisma
 * @type {PrismaClient}
 * @description The main interface for database operations.
 * Configured with dynamic logging levels:
 * - Development: Full query, info, and warn logs.
 * - Production: Only warn and error logs to optimize performance.
 */
export const prisma: PrismaClient = new PrismaClient({
    datasources: {
        db: { url: ENV_CONFIG.DATABASE.URL as string },
    },
    log: ENV_CONFIG.NODE_ENV === "development" ? ["query", "info", "warn", "error"] : ["warn", "error"],
});