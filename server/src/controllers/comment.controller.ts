/**
 * @file comment.controller.ts
 * @module Controllers/Classroom/Comments
 * @description Controller logic for managing discussions on classroom announcements.
 * Implements a moderation-aware model where authors can edit their content, 
 * but both authors and classroom staff (Tutors/Creators) can moderate (delete) content.
 * @author Sayan Chandra
 */
import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.ts";
import { BadRequestError, ForbiddenError, NotFoundError } from "../errors/handler.error.ts";
import { prisma } from "../configs/database.config.ts";

/**
 * @async
 * @function getCommentsForAnnouncement
 * @description Retrieves a chronological list of comments for a specific announcement.
 * @param {AuthenticatedRequest} req - Request containing 'announcementId' in params via route merging.
 * @param {Response} res - Success response with an array of comment objects.
 * @param {NextFunction} next - Error propagation.
 * @throws {BadRequestError} 400 - If the announcementId is malformed or missing.
 * @returns {Promise<void>}
 */
export const getCommentsForAnnouncement = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
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
            orderBy: { createdAt: 'asc' }, // Chronological order for readable conversation
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

/**
 * @async
 * @function createComment
 * @description Persists a new comment linked to an announcement.
 * Logic:
 * 1. Validates text content and identifiers.
 * 2. Checks for Announcement existence via foreign key constraints.
 * @param {AuthenticatedRequest} req - Body: { text }. Params: { announcementId }.
 * @throws {NotFoundError} 404 - If the parent announcement does not exist (caught via P2003).
 */
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
        /**
         * @section Foreign Key Constraint Handling
         * P2003 occurs if 'announcementId' doesn't point to a valid record.
         */
        if (error.code === 'P2003') {
            next(new NotFoundError("The specified announcement does not exist"));
        }
        next(error);
    }
};

/**
 * @async
 * @function updateComment
 * @description Allows the original author to modify the text of their comment.
 * @param {AuthenticatedRequest} req - Params: { commentId }. Body: { text }.
 * @throws {ForbiddenError} 403 - If a user attempts to edit a comment they did not author.
 */
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

/**
 * @async
 * @function deleteComment
 * @description Removes a comment from the database.
 * **Moderation Policy:**
 * - **Authors** can delete their own comments.
 * - **Tutors/Creators** can delete ANY comment within their classroom (for moderation).
 * @param {AuthenticatedRequest} req - Params: { commentId }.
 */
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