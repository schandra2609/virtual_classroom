import arcjet, { shield, detectBot, tokenBucket, fixedWindow, sensitiveInfo } from "@arcjet/node";
import { ENV_CONFIG } from "./env.config.ts";

export const ajConfig = arcjet({
    key: ENV_CONFIG.ARCJET.API_KEY as string,
    characteristics: ["ip.src"],
    rules: [
        shield({
            mode: "LIVE",
        }),
        detectBot({
            mode: "LIVE",
            allow: ["CATEGORY:SEARCH_ENGINE", "CATEGORY:MONITOR", "CATEGORY:PREVIEW"],
        }),
        fixedWindow({
            mode: "LIVE",
            window: "1m",
            max: 100,
        }),
        sensitiveInfo({
            mode: "LIVE",
            deny: ["CREDIT_CARD_NUMBER", "EMAIL", "PHONE_NUMBER"],
        }),
    ],
});