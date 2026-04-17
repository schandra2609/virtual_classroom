/**
 * @file arcjet.config.ts
 * @module Config/Security
 * @description Centralized security configuration using the Arcjet engine.
 * This module establishes a multi-layered defense strategy (WAF, Bot Management,
 * Rate Limiting, and PII Protection) to secure the Virtual Classroom API at the edge.
 * @author Sayan Chandra
 */
import arcjet, {
    shield,
    detectBot,
    fixedWindow,
    sensitiveInfo,
} from "@arcjet/node";
import { ENV_CONFIG } from "./env.config.ts";
import Logger from "../utils/Logger.ts";

/**
 * @constant ajConfig
 * @description The primary Arcjet security instance.
 * It uses the request's source IP as the primary characteristic for tracking and
 * enforcement across the following security layers:
 * 1. **Shield (WAF)**: Protects against common web vulnerabilities (SQLi, XSS, etc).
 * 2. **Bot Detection**: Distinguishes between automated threats and beneficial crawlers.
 * 3. **Rate Limiting**: Implements a 'Fixed Window' algorithm to prevent API abuse.
 * 4. **Sensitive Info**: Scans request payloads to prevent the transmission of PII.
 */
export const ajConfig = arcjet({
    /** @property {string} key - Arcjet API Key retrieved from ENV_CONFIG */
    key: ENV_CONFIG.ARCJET.API_KEY as string,

    /** @property {string[]} characteristics - Fingerprinting method (Source IP Tracking) */
    characteristics: ["ip.src"] as const,

    rules: [
        /**
         * @section Shield Rule
         * @description Advanced protection layer that analyzes request patterns
         * to block common OWASP Top 10 attacks like SQL Injection and Cross-Site Scripting.
         */
        shield({
            mode: "LIVE" as const,
        }),

        /**
         * @section Bot Detection Rule
         * @description Identifies automated traffic. Configured to allow 'Good' bots
         * (Search Engines, Status Monitors) while blocking unauthorized scrapers.
         */
        detectBot({
            mode: "LIVE" as const,
            allow: [
                "CATEGORY:SEARCH_ENGINE", // Allows Google, Bing, etc.
                "CATEGORY:MONITOR", // Allows Uptime monitors
                "CATEGORY:PREVIEW", // Allows social media link previews
            ] as const,
        }),

        /**
         * @section Rate Limiting Rule
         * @description Prevents brute-force attacks and resource exhaustion.
         * Configuration: 100 requests per 1-minute window per unique IP.
         */
        fixedWindow({
            mode: "LIVE" as const,
            window: "1m" as string,
            max: 100 as number,
        }),

        /**
         * @section Sensitive Info Rule
         * @description Data Loss Prevention (DLP) layer. Scans incoming data for
         * Personally Identifiable Information (PII) to ensure regulatory compliance.
         */
        sensitiveInfo({
            mode: "LIVE" as const,
            deny: ["CREDIT_CARD_NUMBER", "EMAIL", "PHONE_NUMBER"] as const,
        }),
    ],
});

/**
 * @async
 * @function verifyArcjetConnection
 * @description Validates the presence of the Arcjet API key on server startup.
 * Provides a proactive warning in the logs if the security engine is unconfigured.
 *
 * @returns {Promise<void>}
 */
export const verifyArcjetConnection = async (): Promise<void> => {
    if (!ENV_CONFIG.ARCJET.API_KEY || ENV_CONFIG.ARCJET.API_KEY === "") {
        Logger.warn(
            "Arcjet: ARCJET_API_KEY is missing. Edge security rules are inactive.",
        );
    } else {
        Logger.log(
            "🛡️ Arcjet: Security engine initialized and monitoring traffic.",
        );
    }
};
