/**
 * @file env.config.ts
 * @module Config/Environment
 * @description Centralized environment variable management.
 * This module loads environment-specific variables from respective .env files,
 * validates them and exports a structured, typed configuration object.
 * @author Sayan Chandra
 */
import { config } from "dotenv";
import path from "path";
import Logger from "../utils/Logger.ts";

// Determine the environment and load the corresponding .env file
config({
    path: path.resolve(
        process.cwd(),
        `.env.${process.env.NODE_ENV || "development"}`,
    ),
});

// Load all environment variables from process environment
const {
    NODE_ENV,
    PORT,
    API_V,
    ACCESS_TOKEN_SECRET,
    ACCESS_TOKEN_LIFETIME,
    REFRESH_TOKEN_SECRET,
    REFRESH_TOKEN_LIFETIME,
    DATABASE_URL,
    DIRECT_URL,
    ARCJET_API_KEY,
    ARCJET_ENV,
    EMAIL_USER,
    EMAIL_APP_PASSWORD,
    ADMIN_EMAIL,
    ADMIN_PASSWORD,
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    MINIO_ENDPOINT,
    MINIO_PORT,
    MINIO_ACCESS_KEY,
    MINIO_SECRET_KEY,
    MINIO_BUCKET,
    MINIO_USE_SSL = "false",
} = process.env;

/**
 * @constant CORS_ORIGIN
 * @type {string[]}
 * @description Parsed list of allowed origins for Cross-Origin Resource Sharing.
 */
const CORS_ORIGIN: string[] = (process.env.CORS_ORIGIN || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin !== "");
Logger.log(`Environment: ${NODE_ENV} | Port: ${PORT} | API: ${API_V}`);

/**
 * @constant ENV_CONFIG
 * @description The application's unified configuration object.
 * Organizes raw environment variables into logical groups for use accross the backend.
 */
export const ENV_CONFIG = {
    /** @property {string} NODE_ENV - Current execution mode (development | production | test) */
    NODE_ENV: NODE_ENV || "development",

    /** @property {number} PORT - The network port the Express server listens on */
    PORT: Number(PORT) || 5000,

    /** @property {string} API_V - Base versioning path for all API routes */
    API_V: API_V || "/api/v1",

    /** @property {string[]} CORS_ORIGIN - Array of URLs allowed to interact with the API */
    CORS_ORIGIN:
        CORS_ORIGIN.length > 0 ? CORS_ORIGIN : ["http://localhost:3000"],

    /** @section Authentication Security */
    ACCESS_TOKEN: {
        SECRET: ACCESS_TOKEN_SECRET || "fallback_access_token_secret",
        LIFETIME: ACCESS_TOKEN_LIFETIME || "30m",
    },
    REFRESH_TOKEN: {
        SECRET: REFRESH_TOKEN_SECRET || "fallback_refresh_token_secret",
        LIFETIME: REFRESH_TOKEN_LIFETIME || "30d",
    },

    /** @section Database Credentials */
    DATABASE: {
        URL: DATABASE_URL || "",
        DIRECT_URL: DIRECT_URL || "",
    },

    /** @section Security Engine (Arcjet) */
    ARCJET: {
        API_KEY: ARCJET_API_KEY || "",
        ENV: ARCJET_ENV || "development",
    },

    /** @section Seed Credentials */
    ADMIN: {
        EMAIL: ADMIN_EMAIL || "",
        PASSWORD: ADMIN_PASSWORD || "",
    },

    /** @section Email Service Credentials */
    MAILER: {
        USER: EMAIL_USER || "",
        APP_PASSWORD: EMAIL_APP_PASSWORD || "",
    },

    /** @section External Identity Providers (OAuth) */
    GOOGLE_OAUTH: {
        CLIENT_ID: GOOGLE_CLIENT_ID || "",
        CLIENT_SECRET: GOOGLE_CLIENT_SECRET || "",
    },

    /** @section Object Storage (MinIO) */
    MINIO: {
        ENDPOINT: MINIO_ENDPOINT || "localhost",
        PORT: Number(MINIO_PORT) || 9000,
        ACCESS_KEY: MINIO_ACCESS_KEY || "",
        SECRET_KEY: MINIO_SECRET_KEY || "",
        BUCKET: MINIO_BUCKET || "uploads",
        USE_SSL: MINIO_USE_SSL.toLowerCase() === "true" || false,
    },
};
