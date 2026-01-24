/**
 * @file Storage.ts
 * @module Utils/Storage
 * @description abstract layer for MinIO operations. Handles file naming,
 * buffer uploads, and generating signed URLs for private access.
 */
import path from "path";
import { randomUUID } from "crypto";
import { minioClient, BucketName } from "../configs/minio.config.ts";

/**
 * @class Storage
 * @description - Facilitates with all necessary methods required for file management
 */
export default class Storage {
    /**
     * @method uploadBuffer
     * @description Uploads a file buffer to MinIO with a unique UUID name to prevent collisions.
     * 
     * @param {Buffer} buffer - The file buffer from Multer.
     * @param {string} originalName - Original filename to extract extension.
     * @param {string} mimetype - The MIME type of the file.
     * @param {string} folder - Optional sub-folder path inside the bucket (e.g., 'profiles/').
     * @returns {Promise<string>} The unique filename/path stored in MinIO.
     */
    static uploadBuffer = async (buffer: Buffer, originalName: string, mimetype: string, folder: string = ""): Promise<string> => {
        const fileExt = path.extname(originalName);
        const fileName = `${folder}${randomUUID()}${fileExt}`;

        await minioClient.putObject(BucketName, fileName, buffer, buffer.length, {
            "Content-Type": mimetype,
        });
        return fileName;
    };

    /**
     * @method getPresignedUrl
     * @description Generates a temporary signed URL for viewing private files.
     * 
     * @param {string} fileName - The path/name of the file in the bucket.
     * @param {number} expiry - Expiry time in seconds (Default: 1 hour).
     * @returns {Promise<string>} A signed URL string.
     */
    static getPresignedUrl = async (fileName: string, expiry: number = 3600): Promise<string> => {
        return await minioClient.presignedGetObject(BucketName, fileName, expiry);
    };

    /**
     * @method deleteFile
     * @description Removes an object from the MinIO bucket.
     * @param {string} fileName - The name of the file to delete.
     */
    static deleteFile = async (fileName: string): Promise<void> => {
        await minioClient.removeObject(BucketName, fileName);
    };
}