import * as Minio from "minio";
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
            console.log(`🪣  MinIO: Bucket "${BucketName}" is ready.`);
        } else {
            await minioClient.makeBucket(BucketName, 'us-east-1');
            console.log(`🪣  MinIO: Bucket "${BucketName}" created successfully.`);
        }
    } catch (error) {
        console.error('MinIO: Failed to initialize storage:', error);
    }
}