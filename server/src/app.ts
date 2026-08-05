/**
 * @file app.ts
 * @module Core/Application
 * @description The main Express application entry point.
 * This file configures the middleware pipeline, security layers,
 * request parsing, and routing architecture for the Virtual Classroom API.
 * @author Sayan Chandra
 */
import express from "express";
import type { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import passport from "passport";
import { configureGoogleStrategy } from "./configs/passport.config.ts";
import { globalErrorHandler } from "./middlewares/error.middleware.ts";
import rootRouter from "./routes/root.routes.ts";
import { ENV_CONFIG } from "./configs/env.config.ts";
import pinoHttp from "pino-http";
import { pinoInstance } from "./utils/Logger.ts";
import type { IncomingMessage, ServerResponse } from "http";

/**
 * @constant app
 * @type {Application}
 * @description The Express application instance.
 */
const app: Application = express();

/**
 * @section Network Security
 * @description Configures proxy trust settings.
 * 'trust proxy' is essential when the app is behind a load balancer (like Nginx, Vercel, or AWS).
 * Setting it to '1' trusts the first hop (the immediate proxy).
 */
if (ENV_CONFIG.NODE_ENV === "production") {
    app.set("trust proxy", 1);
}

/**
 * @section Security Middlewares
 */

/**
 * @description Helmet helps secure Express apps by setting various HTTP headers.
 * It protects against common vulnerabilities like XSS, Clickjacking, and MIME-sniffing.
 */
app.use(helmet());

/**
 * @description Cross-Origin Resource Sharing (CORS) configuration.
 * Permits the frontend (Vite/React) to communicate with this API.
 * 'credentials: true' is mandatory for the browser to send/receive HttpOnly cookies (Refresh Tokens).
 */
app.use(
    cors({
        origin: (origin, callback) => {
            callback(null, origin || true);
        },
        credentials: true,
    })
);
// app.use(
//     cors(
//         {
//             origin: (origin, callback) => {
//                 if (!origin || ENV_CONFIG.CORS_ORIGIN.includes(origin)) {
//                     callback(null, true);
//                 } else {
//                     console.error(`[CORS] Rejected origin: ${origin}`);
//                     console.info(
//                         `[CORS] Allowed origins: ${ENV_CONFIG.CORS_ORIGIN.join(", ")}`,
//                     );
//                     callback(new Error("Not allowed by CORS"));
//                 }
//             },
//             credentials: true,
//         }
//     )
// );

/**
 * @section Request Parsers
 * Minimum required middlewares to handle JSON, Form Data, and Cookies.
 */

/**
 * @description Built-in middleware to parse incoming requests with JSON payloads.
 * Limit is set to 16kb to protect against large-payload Denial of Service (DoS) attacks.
 */
app.use(express.json({ limit: "16kb" }));

/**
 * @description Built-in middleware to parse URL-encoded bodies (standard HTML forms).
 * 'extended: true' allows for parsing of nested objects.
 */
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

/**
 * @description Middleware to parse the Cookie header and populate req.cookies.
 * Vital for the 'Refresh Token' strategy used in the authentication flow.
 */
app.use(cookieParser());

/**
 * @description Serves static assets from the 'public' directory.
 * Useful for robots.txt or default placeholder images.
 */
app.use(express.static("public"));

/**
 * @section Logging & Authentication
 */

/**
 * @description HTTP request logger middleware powered by Pino.
 * Automatically logs request details, response times, and status codes.
 */
app.use(
    (pinoHttp as any)({
        logger: pinoInstance,
        // Optional: Custom log level logic based on HTTP status codes
        customLogLevel: function (req: IncomingMessage, res: ServerResponse, err?: Error) {
            if (res.statusCode >= 400 && res.statusCode < 500) {
                return 'warn';
            } else if (res.statusCode >= 500 || err) {
                return 'error';
            }
            return 'info';
        },
        // Keeps development logs concise by hiding heavy request/response headers
        serializers: ENV_CONFIG.NODE_ENV === "development" ? {
            req: (req: IncomingMessage) => ({ method: req.method, url: req.url }),
            res: (res: ServerResponse) => ({ statusCode: res.statusCode }),
        } : undefined
    })
);

/**
 * @description Passport.js initialization for OAuth 2.0.
 * Strategies are configured externally to keep app.ts clean.
 */
app.use(passport.initialize());
configureGoogleStrategy(passport);

/**
 * @section API Routing
 * @description Mounts the root router. All API endpoints are prefixed with the version string (e.g., /api/v1).
 */
app.use(`${ENV_CONFIG.API_V}`, rootRouter);

/**
 * @section Error Handling Layer
 * @description Catch-all global error handler.
 * Processes all errors passed via next(err) and returns standardized JSON responses.
 * MUST be the final middleware in the pipeline.
 */
app.use(globalErrorHandler);

export default app;
