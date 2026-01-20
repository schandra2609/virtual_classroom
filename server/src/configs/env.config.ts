import { config } from "dotenv";
import path from "path";

config({ path: path.resolve(process.cwd(), `.env.${process.env.NODE_ENV || "development"}`) });

const {
    NODE_ENV, PORT, API_V,
    ACCESS_TOKEN_SECRET, ACCESS_TOKEN_LIFETIME,
    REFRESH_TOKEN_SECRET, REFRESH_TOKEN_LIFETIME,
    DATABASE_URL, DIRECT_URL,
    ARCJET_API_KEY, ARCJET_ENV,
    EMAIL_USER, EMAIL_APP_PASSWORD,
    ADMIN_EMAIL, ADMIN_PASSWORD,
    GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET,
    SESSION_SECRET,
    MINIO_ENDPOINT, MINIO_PORT,
    MINIO_ACCESS_KEY, MINIO_SECRET_KEY,
    MINIO_BUCKET, MINIO_USE_SSL = "false",
} = process.env;

const CORS_ORIGIN = (process.env.CORS_ORIGIN || "").split(',').map(origin => origin.trim()).filter(origin => origin !== "");
console.log(`🚀 Environment: ${NODE_ENV} | Port: ${PORT} | API: ${API_V}`);

export const ENV_CONFIG = {
    NODE_ENV: NODE_ENV || "development",
    PORT: Number(PORT) || 5000,
    API_V: API_V || "/api/v1",
    CORS_ORIGIN: CORS_ORIGIN.length > 0 ? CORS_ORIGIN : ["http://localhost:3000"],
    ACCESS_TOKEN: {
        SECRET: ACCESS_TOKEN_SECRET || "fallback_access_token_secret",
        LIFETIME: ACCESS_TOKEN_LIFETIME || "30m",
    },
    REFRESH_TOKEN: {
        SECRET: REFRESH_TOKEN_SECRET || "fallback_refresh_token_secret",
        LIFETIME: REFRESH_TOKEN_LIFETIME || "30d",
    },
    DATABASE: {
        URL: DATABASE_URL || "",
        DIRECT_URL: DIRECT_URL || "",
    },
    ARCJET: {
        API_KEY: ARCJET_API_KEY || "",
        ENV: ARCJET_ENV || "development",
    },
    ADMIN: {
        EMAIL: ADMIN_EMAIL || "",
        PASSWORD: ADMIN_PASSWORD || "",
    },
    MAILER: {
        USER: EMAIL_USER || "",
        APP_PASSWORD: EMAIL_APP_PASSWORD || "",
    },
    GOOGLE_OAUTH: {
        CLIENT_ID: GOOGLE_CLIENT_ID || "",
        CLIENT_SECRET: GOOGLE_CLIENT_SECRET || "",
    },
    SESSION_SECRET: SESSION_SECRET || "",
    MINIO: {
        ENDPOINT: MINIO_ENDPOINT || "localhost",
        PORT: Number(MINIO_PORT) || 9000,
        ACCESS_KEY: MINIO_ACCESS_KEY || "",
        SECRET_KEY: MINIO_SECRET_KEY || "",
        BUCKET: MINIO_BUCKET || "uploads",
        USE_SSL: MINIO_USE_SSL.toLowerCase() === "true" || false,
    },
};