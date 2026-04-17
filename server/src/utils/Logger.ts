/**
 * @file Logger.ts
 * @module Utils/Logger
 * @description Centralized logging utility powered by Pino.
 * Uses structured JSON logging in production for performance and indexing,
 * and pino-pretty in development for human-readable terminal output.
 * @author Sayan Chandra
 */
import pino from "pino";

const isDev = process.env.NODE_ENV === "development";

/**
 * Configure the core Pino instance
 */
export const pinoInstance = pino({
    level: isDev ? "debug" : "info",
    ...(isDev && {
        transport: {
            target: "pino-pretty",
            options: {
                colorize: true,
                translateTime: "SYS:standard", // E.g., 2026-04-09 21:15:00.000 +0530
                ignore: "pid,hostname",        // Keeps the terminal clean
                messageFormat: "{msg}",
            },
        },
    }),
});

/**
 * Adapter interface to maintain backwards compatibility with the existing codebase.
 * This prevents needing to rewrite Logger.log() across the entire project.
 */
const Logger = {
    // We map 'log' to 'info' because Pino doesn't have a native 'log' level
    log: (msg: string, ...args: any[]) => pinoInstance.info(msg, ...args),
    info: (msg: string, ...args: any[]) => pinoInstance.info(msg, ...args),
    error: (msg: string | Error, ...args: any[]) => pinoInstance.error(msg, ...args),
    warn: (msg: string, ...args: any[]) => pinoInstance.warn(msg, ...args),
    debug: (msg: string, ...args: any[]) => pinoInstance.debug(msg, ...args),
    fatal: (msg: string | Error, ...args: any[]) => pinoInstance.fatal(msg, ...args),
};

export default Logger;