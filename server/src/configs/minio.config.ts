import * as Minio from "minio";
import Logger from "../utils/Logger.ts";
import { ENV_CONFIG } from "./env.config.ts";

export const minioClient = new Minio.Client({
    endPoint: ENV_CONFIG.MINIO.ENDPOINT,
    port: ENV_CONFIG.MINIO.PORT,
    useSSL: ENV_CONFIG.MINIO.USE_SSL,
    accessKey: ENV_CONFIG.MINIO.ACCESS_KEY,
    secretKey: ENV_CONFIG.MINIO.SECRET_KEY
});

export const BucketName = ENV_CONFIG.MINIO.BUCKET;

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