import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.ts";
import { BadRequestError, ForbiddenError, NotFoundError } from "../errors/handler.error.ts";
import { prisma } from "../configs/database.config.ts";

export const getCommentsForAnnouncement = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { announcementId } = req.params as { announcementId: string };
        if(!announcementId?.trim()) {
            throw new BadRequestError("Announcement ID is required.");
        }

        const comments = await prisma.comment.findMany({
            where: { announcementId: announcementId },
            include: {
                author: { select: { id: true, fullName: true } },
            },
            orderBy: { createdAt: 'asc' },
        });

        res.status(200).json({
            success: true,
            data: comments,
            message: "Comments retrieved successfully",
        });
    } catch (error) {
        next(error);
    }
};

export const createComment = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { announcementId } = req.params as { announcementId: string };
        const authorId = req.user?.id as string;
        const { text } = req.body as { text: string };
        if(![announcementId, authorId, text].every((field) => field.trim())) {
            throw new BadRequestError("Announcement ID, author ID, text are required.");
        }

        const newComment = await prisma.comment.create({
            data: {
                text: text,
                announcementId: announcementId,
                authorId: authorId,
            },
            include: {
                author: {
                    select: { id: true, fullName: true },
                },
            },
        });
        res.status(201).json({
            success: true,
            data: newComment,
            message: "Comment posted successfully",
        });
    } catch (error: any) {
        if (error.code === 'P2003') {
            next(new NotFoundError("The specified announcement does not exist"));
        }
        next(error);
    }
};

export const updateComment = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { commentId } = req.params as { commentId: string };
        const { text } = req.body as { text: string };
        const userId = req.user?.id as string;
        if(![commentId, text, userId].every((field) => field.trim())) {
            throw new BadRequestError("Comment ID, user ID, text are required.");
        }

        const originalComment = await prisma.comment.findUnique({ where: { id: commentId } });
        if (!originalComment) {
            throw new NotFoundError("Comment not found.");
        }
        if (originalComment.authorId !== userId) {
            throw new ForbiddenError("You can only edit your own comments");
        }

        const updatedComment = await prisma.comment.update({
            where: { id: commentId },
            data: { text: text },
        });
        res.status(200).json({
            success: true,
            data: updatedComment,
            message: "Comment updated successfully",
        });
    } catch (error) {
        next(error);
    }
};

export const deleteComment = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { commentId } = req.params as { commentId: string };
        const userId = req.user?.id as string;
        const membershipRole = req.membership?.role as string;
        if(![commentId, userId, membershipRole].every((field) => field.trim())) {
            throw new BadRequestError("Comment ID, user ID, membership role are required.");
        }

        const commentToDelete = await prisma.comment.findUnique({
            where: { id: commentId },
            select: { authorId: true },
        });
        if (!commentToDelete) {
            throw new NotFoundError("Comment not found");
        }

        const isAuthor = commentToDelete.authorId === userId;
        const isTutor = ["CREATOR", "CO_TUTOR"].includes(membershipRole);
        if(!isAuthor && !isTutor) {
            throw new ForbiddenError("You are not permitted to delete this comment");
        }

        await prisma.comment.delete({ where: { id: commentId } });
        res.status(200).json({
            success: true,
            message: "Comment deleted successfully",
        });
    } catch (error) {
        next(error);
    }
};