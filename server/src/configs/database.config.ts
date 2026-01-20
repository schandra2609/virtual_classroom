import { PrismaClient } from "../../generated/prisma/client.ts";
import { ENV_CONFIG } from "./env.config.ts";

export const prisma = new PrismaClient({
    datasources: {
        db: { url: ENV_CONFIG.DATABASE.URL },
    },
    log: ENV_CONFIG.NODE_ENV === "development" ? ["query", "info", "warn", "error"] : ["warn", "error"],
});