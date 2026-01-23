/**
 * @file arcjet.config.ts
 * @module Config/Security
 * @description Configuration for the Arcjet security engine. 
 * Provides runtime protection against bots, SQL injection, XSS, and rate-limiting.
 */
import arcjet, { shield, detectBot, fixedWindow, sensitiveInfo } from "@arcjet/node";
import { ENV_CONFIG } from "./env.config.ts";

/**
 * @constant ajConfig
 * @description Arcjet instance configured with multilayered security rules:
 * 1. Shield: Real-time protection against common OWASP attacks.
 * 2. Bot Detection: Blocks malicious scrapers while allowing search engines.
 * 3. Rate Limiting: Prevents brute-force via a fixed-window algorithm (100req/min).
 * 4. Sensitive Info: Detects and filters PII like credit cards and emails in request payloads.
 */
export const ajConfig = arcjet({
    key: ENV_CONFIG.ARCJET.API_KEY as string,
    characteristics: ["ip.src"] as const,
    rules: [
        shield({
            mode: "LIVE" as const,
        }),
        detectBot({
            mode: "LIVE" as const,
            allow: ["CATEGORY:SEARCH_ENGINE", "CATEGORY:MONITOR", "CATEGORY:PREVIEW"] as const,
        }),
        fixedWindow({
            mode: "LIVE" as const,
            window: "1m" as string,
            max: 100 as number,
        }),
        sensitiveInfo({
            mode: "LIVE" as const,
            deny: ["CREDIT_CARD_NUMBER", "EMAIL", "PHONE_NUMBER"] as const,
        }),
    ],
});