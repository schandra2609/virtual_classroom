/**
 * @file announcement.controller.ts
 * @module Controllers/Classroom/Announcements
 * @description Controller logic for managing classroom announcements.
 * Handles content creation with multi-file attachments, retrieval of announcement
 * feeds, and secure deletion with automatic storage cleanup.
 * @author Sayan Chandra
 */
import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.ts";
import { BadRequestError, ForbiddenError, NotFoundError } from "../errors/handler.error.ts";
import { prisma } from "../configs/database.config.ts";
import { deleteFile, uploadBuffer } from "../services/storage.service.ts";

/**
 * @async
 * @function getAnnouncements
 * @description Retrieves all announcements for a specific classroom.
 * Includes author details, associated attachments, and a count of comments.
 * @param {AuthenticatedRequest} req - Request containing 'classroomId' in params.
 * @param {Response} res - Success response with the array of announcements.
 * @param {NextFunction} next - Error propagation.
 * @returns {Promise<void>}
 */
export const getAnnouncements = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { classroomId } = req.params as { classroomId: string };
        if(!classroomId.trim()) {
            throw new BadRequestError("Classroom ID is required.");
        }

        const announcements = await prisma.announcement.findMany({
            where: { classroomId: classroomId },
            include: {
                author: { select: { fullName: true, profilePhotoUrl: true } },
                attachments: true,
                _count: { select: { comments: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.status(200).json({
            success: true,
            data: announcements,
            message: "Announcements retrieved successfully",
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @async
 * @function createAnnouncement
 * @description Creates a new classroom announcement with optional file attachments.
 * Logic:
 * 1. Validates inputs and author session.
 * 2. Initiates a **Database Transaction**.
 * 3. Creates the core Announcement record.
 * 4. Iterates through uploaded files, transfers them to MinIO, and creates Attachment records linked to the new announcement.
 * 5. Returns the fully populated announcement object.
 * @param {AuthenticatedRequest} req - Request containing 'classroomId' in params and 'message' in body.
 * @returns {Promise<void>}
 */
export const createAnnouncement = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { classroomId } = req.params as { classroomId: string };
        const authorId = req.user?.id as string;
        const { message } = req.body as { message: string };

        /** @section Validation */
        if (![classroomId, message].every((field) => field.trim())) {
            throw new BadRequestError("Announcement message, classroom ID are required.");
        }

        const files = req.files as Express.Multer.File[];

         /** @section Atomic Transaction */
        const announcement: any = await prisma.$transaction(async (txn) => {
            // Step 1: Create Announcement
            const newAnnouncement = await txn.announcement.create({
                data: {
                    message: message?.trim(),
                    classroomId: classroomId.trim(),
                    authorId: authorId.trim(),
                }
            });

            // Step 2: Handle File Uploads (if any)
            if(files && files.length > 0) {
                const attachmentData = await Promise.all(
                    files.map(async (file) => {
                        // Stream buffer to MinIO under the classroom's dedicated directory
                        const storedPath = await uploadBuffer(
                            file.buffer,
                            file.originalname,
                            file.mimetype,
                            `classrooms/${classroomId}/attachments/`
                        );
                        return {
                            url: storedPath,
                            fileName: file.originalname,
                            fileType: file.mimetype,
                            announcementId: newAnnouncement.id,
                        };
                    })
                );
                // Batch create references in PostgreSQL
                await txn.attachment.createMany({ data: attachmentData });
            }

            return txn.announcement.findUnique({
                where: { id: announcement.id },
                include: { attachments: true, author: { select: { fullName: true } } },
            });
        });

        res.status(201).json({
            success: true,
            data: announcement,
            message: "Announcement created successfully",
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @async
 * @function deleteAnnouncement
 * @description Permanently removes an announcement.
 * Security & Integrity Logic:
 * 1. Checks if the requester is either the original author or the classroom creator.
 * 2. Fetches all associated attachment URLs.
 * 3. Deletes the physical binary files from the MinIO server.
 * 4. Removes the announcement and attachment records from the database.
 * @param {AuthenticatedRequest} req - Request containing 'announcementId' in params.
 * @throws {NotFoundError} 404 - If announcement doesn't exist.
 * @throws {ForbiddenError} 403 - If the user lacks sufficient permissions.
 * @returns {Promise<void>}
 */
export const deleteAnnouncement = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { announcementId } = req.params as { announcementId: string };
        const userId = req.user?.id as string;
        if (!announcementId?.trim()) {
            throw new BadRequestError("Announcement ID is required.");
        }

        const announcement = await prisma.announcement.findUnique({
            where: { id: announcementId },
            include: { attachments: true },
        });
        if (!announcement) throw new NotFoundError("Announcement not found.");

        const isAuthor = announcement.authorId === userId;
        const isCreator = req.membership?.role === "CREATOR";
        if (!isCreator && !isAuthor) throw new ForbiddenError("You can only delete your own announcements.");

        if (announcement.attachments.length > 0) {
            await Promise.all(announcement.attachments.map(att => deleteFile(att.url)));
        }

        await prisma.announcement.delete({ where: { id: announcementId } });

        res.status(200).json({
            success: true,
            message: "Announcement deleted successfully.",
        });
    } catch (error) {
        next(error);
    }
};