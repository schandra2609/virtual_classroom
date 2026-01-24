import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.ts";
import { BadRequestError, ForbiddenError, NotFoundError } from "../errors/handler.error.ts";
import { prisma } from "../configs/database.config.ts";
import Storage from "../utils/Storage.ts";

export const getAnnouncements = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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

export const createAnnouncement = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { classroomId } = req.params as { classroomId: string };
        const authorId = req.user?.id as string;
        const { message } = req.body as { message: string };
        if (![classroomId, message].every((field) => field.trim())) {
            throw new BadRequestError("Announcement message, classroom ID are required.");
        }

        const files = req.files as Express.Multer.File[];

        const announcement: any = await prisma.$transaction(async (txn) => {
            const newAnnouncement = await txn.announcement.create({
                data: {
                    message: message?.trim(),
                    classroomId: classroomId.trim(),
                    authorId: authorId.trim(),
                }
            });
            if(files && files.length > 0) {
                const attachmentData = await Promise.all(
                    files.map(async (file) => {
                        const storedPath = await Storage.uploadBuffer(
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

export const deleteAnnouncement = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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
            await Promise.all(announcement.attachments.map(att => Storage.deleteFile(att.url)));
        }

        await prisma.announcement.delete({ where: { id: announcementId } });

        res.status(200).json({
            success: true,
            message: "Announcement deleted successfully.",
        });
    } catch (error) {
        next(error);
    }
}