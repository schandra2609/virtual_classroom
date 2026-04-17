/**
 * @file upload.middleware.ts
 * @module Middlewares/Upload
 * @description Configures Multer for handling multipart/form-data.
 * Uses memory storage to facilitate direct streaming to MinIO object storage.
 * Supports image validation for profile pictures and document validation for assignments.
 */
import multer from "multer";
import type { Request } from "express";
import { UnsupportedMediaTypeError } from "../utils/Error.ts";

/**
 * @constant storage
 * @description Files are stored in memory as Buffers. This is ideal for
 * serverless environments or when transferring files immediately to MinIO.
 */
const storage = multer.memoryStorage();

/**
 * @function fileFilter
 * @description Validates the file type before allowing the upload.
 * @param {Request} _req - Express request object.
 * @param {Express.Multer.File} file - The file being uploaded.
 * @param {multer.FileFilterCallback} cb - Callback to accept or reject the file.
 */
const fileFilter = (
    _req: Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback,
) => {
    // List of allowed mimetypes for a classroom environment
    const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(
            new UnsupportedMediaTypeError(
                `File type ${file.mimetype} is not supported. Please upload an image (JPEG/PNG/WebP) or a document (PDF/DOCX).`,
            ),
        );
    }
};

/**
 * @constant upload
 * @description Exported Multer middleware instance.
 *
 * Configuration:
 * - Storage: Memory
 * - Limits: 5MB file size limit to prevent Denial of Service (DoS) via large payloads.
 * - Filter: Enforces specific mimetypes.
 */
export const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 1024 * 1024 * 5, // 5 MB
        files: 1, // Only 1 file per field by default
    },
});
