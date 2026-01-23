import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.ts";
import { BadRequestError, NotFoundError, UnauthorizedError } from "../errors/handler.error.ts";
import { prisma } from "../configs/database.config.ts";

type Attachment = {
    url: string,
    fileName: string,
    fileType: string,
};

export const getAnnouncements = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { classroomId } = req.params as { classroomId: string };
        if(!classroomId.trim()) {
            throw new BadRequestError("Classroom ID is required.");
        }

        const announcements = await prisma.announcement.findMany({
            where: { classroomId: classroomId },
            include: {
                author: { select: { fullName: true, id: true } },
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
        const { message, attachments } = req.body as { message: string, attachments: Attachment[]};
        if (typeof message !== "string" || !message.trim()) {
            throw new BadRequestError("Announcement message is required.");
        }

        const hasValidAttachments = Array.isArray(attachments)
                                && attachments.length > 0
                                && attachments.every(att =>
                                    typeof att === "object" &&
                                    typeof att.url === "string" && att.url.trim() &&
                                    typeof att.fileName === "string" && att.fileName.trim() &&
                                    typeof att.fileType === "string" && att.fileType.trim()
                                );

        const newAnnouncement = await prisma.$transaction(async (txn) => {
            const announcement = await txn.announcement.create({
                data: {
                    message: message?.trim(),
                    classroomId: classroomId,
                    authorId: authorId,
                }
            });
            if(hasValidAttachments) {
                await txn.attachment.createMany({
                    data: attachments!.map(att => ({
                        url: att.url.trim(),
                        fileName: att.fileName.trim(),
                        fileType: att.fileType.trim(),
                        announcementId: announcement.id,
                    })),
                });
            }
            return txn.announcement.findUnique({
                where: { id: announcement.id },
                include: { attachments: true },
            });
        });

        res.status(201).json({
            success: true,
            data: newAnnouncement,
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

        const originalAnnouncement = await prisma.announcement.findUnique({ where: { id: announcementId } });
        if (!originalAnnouncement) {
            throw new NotFoundError("Announcement not found.");
        }
        if (req.membership?.role !== "CREATOR" || originalAnnouncement.authorId !== userId) {
            throw new UnauthorizedError("You can only delete your own announcements.");
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