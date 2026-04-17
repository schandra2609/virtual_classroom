/**
 * @file arcjet.middleware.ts
 * @module Middlewares/Security
 * @description Implements the Arcjet security engine as an Express middleware.
 * This layer provides runtime protection by analyzing request metadata to enforce
 * rate limits, block malicious bots, and prevent common web attacks (Shield).
 * @author Sayan Chandra
 */
import type { Request, Response, NextFunction } from "express";
import { ajConfig } from "../configs/arcjet.config.ts";
import Logger from "../utils/Logger.ts";
import {
    ForbiddenError,
    TooManyRequestsError,
} from "../errors/handler.error.ts";

/**
 * @async
 * @function arcjetMiddleware
 * @description Intercepts incoming requests to evaluate security risks using Arcjet.
 * 
 * Evaluation Flow:
 * 1. Collects request metadata (IP, Headers, Method, URL).
 * 2. Queries Arcjet cloud engine for a security decision.
 * 3. Parses denial reasons (Rate Limit vs Bot vs Attack).
 * 4. Throws specialized HTTP errors if the request is denied.
 * 
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 * @param {NextFunction} next - The Express next function to proceed to the next middleware/controller.
 * 
 * @throws {TooManyRequestsError} 429 - If the user exceeds the configured rate limit.
 * @throws {ForbiddenError} 403 - If the request is identified as a malicious bot or an automated scraper.
 * @throws {ForbiddenError} 403 - For generic denials (e.g., triggered by Arcjet Shield for SQLi/XSS).

 * @returns {Promise<void>}
 */
export const arcjetMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        /**
         * @description Obtain a security decision based on the request fingerprint.
         * Note: Characteristics like 'ip.src' are automatically extracted by the SDK
         * based on the configuration in arcjet.config.ts.
         */
        const decision = await ajConfig.protect({
            method: req.method,
            url: req.originalUrl,
            headers: req.headers,
            socket: { remoteAddress: req.ip || "" },
        });
        if (decision.isDenied()) {
            /**
             * @section Denial Logic
             * Identify the specific reason for denial to return the correct HTTP status.
             */
            if (decision.reason.isRateLimit()) {
                Logger.warn(`Security: Rate Limit exceeded for IP ${req.ip}`);
                throw new TooManyRequestsError(
                    "Rate limit exceeded. Please try again later.",
                );
            }

            if (decision.reason.isBot()) {
                Logger.warn(`Security: Bot traffic blocked from IP ${req.ip}`);
                throw new ForbiddenError(
                    "Bot traffic is not permitted on this resource.",
                );
            }

            /**
             * Generic denial (usually Shield/WAF rules or sensitive info detection)
             */
            Logger.error(
                `Security: Request denied by Arcjet Shield for IP ${req.ip}`,
            );
            throw new ForbiddenError(
                "Access denied due to security policy violation.",
            );
        }

        /**
         * Request is clean; proceed to the next handler.
         */
        next();
    } catch (error) {
        /**
         * @section Error Handling
         * If Arcjet itself fails (network issue), we log the error but allow
         * the request to proceed (Fail-Open) to ensure high availability,
         * unless you prefer a Fail-Closed approach.
         */
        Logger.error("Arcjet Middleware Error");
        Logger.debug(error instanceof Error ? error.message : String(error));

        // Passing the error to the global error handler
        next(error);
    }
};
