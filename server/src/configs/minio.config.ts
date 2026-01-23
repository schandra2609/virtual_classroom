/**
 * @file minio.config.ts
 * @module Config/Storage
 * @description Configuration and initialization logic for MinIO Object Storage.
 * Handles bucket creation and storage provider connectivity.
 */
import * as Minio from "minio";
import Logger from "../utils/Logger.ts";
import { ENV_CONFIG } from "./env.config.ts";

/**
 * @constant minioClient
 * @type {Minio.Client}
 * @description Configured SDK instance for communicating with the MinIO server.
 */
export const minioClient: Minio.Client = new Minio.Client({
    endPoint: ENV_CONFIG.MINIO.ENDPOINT,
    port: ENV_CONFIG.MINIO.PORT,
    useSSL: ENV_CONFIG.MINIO.USE_SSL,
    accessKey: ENV_CONFIG.MINIO.ACCESS_KEY,
    secretKey: ENV_CONFIG.MINIO.SECRET_KEY
});

/**
 * @constant BucketName
 * @type {string}
 * @description The primary bucket name where all application assets are stored.
 */
export const BucketName: string = ENV_CONFIG.MINIO.BUCKET;

/**
 * @async
 * @function initializeStorage
 * @description Ensures the required storage infrastructure is ready.
 * If the configured bucket does not exist, it creates it with the default region.
 * @returns {Promise<void>}
 * @throws {Error} Logs error if bucket check or creation fails.
 */
export const initializeStorage = async () : Promise<void> => {
    try {
        const existingBucket = await minioClient.bucketExists(BucketName);
        if(existingBucket) {
            Logger.log(`MinIO: Bucket "${BucketName}" is ready.`);
        } else {
            await minioClient.makeBucket(BucketName, 'us-east-1');
            Logger.log(`MinIO: Bucket "${BucketName}" created successfully.`);
        }
    } catch (error) {
        Logger.error('MinIO: Failed to initialize storage.');
        Logger.debug(error instanceof Error ? error.message : String(error));
    }
};