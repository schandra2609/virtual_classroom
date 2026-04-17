/**
 * @file minio.config.ts
 * @module Config/Storage
 * @description Manages the connection and lifecycle of the MinIO Object Storage server.
 * Responsible for storing binary assets like profile photos and classroom attachments.
 * @author Sayan Chandra
 */
import * as Minio from "minio";
import Logger from "../utils/Logger.ts";
import { ENV_CONFIG } from "./env.config.ts";

/**
 * @constant minioClient
 * @type {Minio.Client}
 * @description The SDK client used to interact with the MinIO/S3 API.
 * Configured with endpoint, port, and security credentials from environment variables.
 */
export const minioClient: Minio.Client = new Minio.Client({
    endPoint: ENV_CONFIG.MINIO.ENDPOINT,
    port: ENV_CONFIG.MINIO.PORT,
    useSSL: ENV_CONFIG.MINIO.USE_SSL,
    accessKey: ENV_CONFIG.MINIO.ACCESS_KEY,
    secretKey: ENV_CONFIG.MINIO.SECRET_KEY,
});

/**
 * @constant BucketName
 * @type {string}
 * @description The primary logical container for all application file uploads.
 */
export const BucketName: string = ENV_CONFIG.MINIO.BUCKET;

/**
 * @async
 * @function initializeStorage
 * @description A self-healing initialization script that runs on startup.
 * It checks if the primary bucket exists; if not, it automatically provisions it.
 * This ensures the application is "Plug-and-Play" across different environments.
 * @returns {Promise<void>}
 */
export const initializeStorage = async (): Promise<void> => {
    try {
        const existingBucket = await minioClient.bucketExists(BucketName);
        if (existingBucket) {
            Logger.log(`MinIO: Bucket "${BucketName}" is ready.`);
        } else {
            // US-East-1 is used as the default fallback region for S3 compatibility
            await minioClient.makeBucket(BucketName, "us-east-1");
            Logger.log(`MinIO: Bucket "${BucketName}" created successfully.`);
        }
    } catch (error) {
        Logger.error("MinIO: Failed to initialize storage.");
        Logger.debug(error instanceof Error ? error.message : String(error));
    }
};
