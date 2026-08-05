/**
 * @file storage.service.ts
 * @module Services/Storage
 * @description Service layer for interacting with the MinIO Object Storage system.
 * This module abstracts the complexities of binary data handling, unique key generation,
 * and secure resource provisioning.
 * @author Sayan Chandra
 */
import path from "path";
import { minioClient, BucketName } from "../configs/minio.config.ts";
import { randomUUID } from "crypto";

/**
 * @async
 * @function uploadBuffer
 * @description Processes and uploads a binary buffer to the configured object storage bucket.
 * Logic:
 * 1. Extracts the file extension from the original filename.
 * 2. Generates a Version 4 UUID to act as a unique Object Key, preventing naming collisions.
 * 3. Commits the buffer to MinIO with the appropriate Content-Type metadata.
 * @param {Buffer} buffer - The raw binary data to be uploaded (usually from req.file.buffer).
 * @param {string} originalName - The original name of the file used to preserve the file extension.
 * @param {string} mimetype - The MIME type (e.g., 'image/png') for correct browser rendering.
 * @param {string} [folder=""] - Optional directory prefix inside the bucket (e.g., 'profiles/').
 * @returns {Promise<string>} The unique Object Key (path) under which the file is stored.
 * @throws {Error} If the underlying MinIO connection fails or the bucket is unreachable.
 */
export const uploadBuffer = async (
    buffer: Buffer,
    originalName: string,
    mimetype: string,
    folder: string = "",
): Promise<string> => {
    const fileExt = path.extname(originalName);
    /**
     * @description Generation of a cryptographically strong unique identifier (UUID)
     * to ensure that uploads from different users do not overwrite each other.
     */
    const fileName = `${folder}${randomUUID()}${fileExt}`;

    await minioClient.putObject(BucketName, fileName, buffer, buffer.length, {
        "Content-Type": mimetype,
    });
    return fileName;
};

/**
 * @async
 * @function getPresignedUrl
 * @description Generates a time-limited, secure URL to access private objects.
 * This ensures that files are not exposed to the public internet and can only
 * be accessed by users with a valid application session.
 * @param {string} fileName - The unique Object Key (path) of the file in the bucket.
 * @param {number} [expiry=3600] - URL validity period in seconds. Default is 1 hour.
 * @returns {Promise<string>} A temporary, signed HTTPS URL for the requested asset.
 */
export const getPresignedUrl = async (
    fileName: string,
    expiry: number = 60 * 60 * 24, // 24 hours
): Promise<string> =>
    minioClient.presignedGetObject(BucketName, fileName, expiry);

/**
 * @async
 * @function deleteFile
 * @description Permanently removes an object from the storage bucket.
 * Used for cleaning up orphaned assets when a user updates their profile
 * or deletes an announcement.
 * @param {string} fileName - The unique Object Key (path) of the file to be removed.
 * @returns {Promise<void>}
 */
export const deleteFile = async (fileName: string): Promise<void> =>
    minioClient.removeObject(BucketName, fileName);
