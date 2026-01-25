/**
 * @file qpaper.controller.ts
 * @module Controllers/Classroom/Examinations
 * @description Manages the lifecycle of examination papers. 
 * Handles scheduling, temporal visibility (Live vs. Draft), and 
 * strict data sanitization to prevent answer leaks to students.
 * @author Sayan Chandra
 */
import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.ts";
import { BadRequestError, NotFoundError } from "../errors/handler.error.ts";
import { prisma } from "../configs/database.config.ts";
import { dayjs } from "../configs/dayjs.config.ts";

/**
 * @async
 * @function getAllQuestionPapers
 * @description Retrieves a list of question papers within a classroom.
 * **Security & Temporal Logic:**
 * - **Tutors**: Can see all papers (including future/draft ones).
 * - **Students**: Can only see papers where the 'liveAt' timestamp is in the past.
 * @param {AuthenticatedRequest} req - Request containing 'classroomId' in params.
 * @param {Response} res - Success response with filtered question papers metadata.
 * @returns {Promise<void>}
 */
export const getAllQuestionPapers = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { classroomId } = req.params as { classroomId: string };
        const userRole = req.membership?.role as string;
        if(![classroomId, userRole].every((field) => field.trim())) {
            throw new BadRequestError("Classroom ID, user role are required.");
        }

        const whereClause: any = { classroomId: classroomId };
        /** @section Temporal Visibility Filter */
        if(userRole === "STUDENT") {
            // Students cannot discover future papers via the API
            whereClause.liveAt = { lte: new Date() };
        }

        const questionPapers = await prisma.questionPaper.findMany({
            where: whereClause,
            select: {
                id: true,
                title: true,
                liveAt: true,
                duration: true,
                createdAt: true,
            },
            orderBy: { liveAt: 'desc' },
        });
        res.status(200).json({
            success: true,
            data: questionPapers,
            message: "Question papers for the classroom retrieved successfully.",
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @async
 * @function createQuestionPaper
 * @description Initializes a new exam paper. Sets the scheduling and duration.
 * @param {AuthenticatedRequest} req - Body: { title, liveAt, duration }.
 * @throws {BadRequestError} 400 - If liveAt is in the past or duration is invalid.
 * @throws {NotFoundError} 404 - If the parent classroom is invalid (P2003).
 * @returns {Promise<void>}
 */
export const createQuestionPaper = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { classroomId } = req.params as { classroomId: string };
        const creatorId = req.user?.id as string;
        const { title, liveAt, duration } = req.body as { title: string, liveAt: string, duration: string };
        if(![creatorId, classroomId, duration, title, liveAt].every((field) => field.trim())) {
            throw new BadRequestError("Classroom ID, creator ID, title, duration, live at fields are required.");
        }

        const liveAtDate = dayjs(liveAt);
        if (!liveAtDate.isValid() || liveAtDate.isBefore(dayjs())) {
            throw new BadRequestError("Invalid or expired date time.");
        }

        const newPaper = await prisma.questionPaper.create({
            data: {
                title: title,
                liveAt: liveAtDate.toDate(),
                duration: parseInt(duration, 10),
                classroomId: classroomId,
                creatorId: creatorId,
            },
        });
        res.status(201).json({
            success: true,
            data: newPaper,
            message: "Question paper created.",
        });
    } catch (error: any) {
        if(error.code === "P2003") {
            next(new NotFoundError("The specified classroom does not exist."));
        }
        next(error);
    }
};

/**
 * @async
 * @function getQuestionPaperById
 * @description Retrieves a full question paper including questions and options.
 * **CRITICAL SECURITY FEATURE: DATA SANITIZATION**
 * - If the requester is a **STUDENT**, the controller strips 'isCorrect' flags 
 *   from options and 'numericalCorrectAnswer' from NAT questions before sending 
 *   the response. This prevents cheating via Browser DevTools/Network Tab.
 * @param {AuthenticatedRequest} req - Request containing 'paperId' in params.
 * @returns {Promise<void>}
 */
export const getQuestionPaperById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { paperId } = req.params as { paperId: string };
        const userAccountType = req.user?.accountType as string;
        if(![paperId, userAccountType].every((field) => field.trim())) {
            throw new BadRequestError("Missing values: paper id, user");
        }

        const questionPaper = await prisma.questionPaper.findUnique({
            where: { id: paperId },
            include: { questions: { include: { options: true } } },
        });
        if (!questionPaper) {
            throw new NotFoundError("Question paper not found.");
        }

        const sanitizedPaper = userAccountType === "STUDENT" ?
                                {
                                    ...questionPaper,
                                    questions: questionPaper.questions.map((q) => {
                                        // Strip NAT correct answer
                                        if(q.numericalCorrectAnswer !== null) {
                                            const { numericalCorrectAnswer, ...rest } = q;
                                            return rest;
                                        }
                                        // Strip MCQ/MSQ correct flags
                                        return {
                                            ...q,
                                            options: q.options.map(({ isCorrect, ...option }) => option),
                                        };
                                    }),
                                } : questionPaper;

        res.status(200).json({
            success: true,
            data: sanitizedPaper,
            message: "Question paper fetched successfully",
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @async
 * @function updateQuestionPaper
 * @description Updates existing paper metadata. Supports partial updates.
 * @returns {Promise<void>}
 */
export const updateQuestionPaper = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { paperId } = req.params as { paperId: string };
        const { title, liveAt, duration } = req.body as { title: string, liveAt: string, duration: string };
        if(!paperId?.trim()) {
            throw new BadRequestError("Paper ID is required.");
        }

        const dataToUpdate: any = {};
        if(title) dataToUpdate.title = title;
        if (duration) dataToUpdate.duration = parseInt(duration, 10);
        if (liveAt) {
            const liveAtDate = dayjs(liveAt);
            if (!liveAtDate.isValid()) {
                throw new BadRequestError("The scheduled live time must be a valid date.");
            }
            dataToUpdate.liveAt = liveAtDate.toDate();
        }
        if(!dataToUpdate) {
            throw new BadRequestError("Nothing to update.");
        }

        const updatedPaper = await prisma.questionPaper.update({
            where: { id: paperId },
            data: dataToUpdate,
        });

        res.status(200).json({
            success: true,
            data: updatedPaper,
            message: "Question paper updated.",
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @async
 * @function deleteQuestionPaper
 * @description Deletes a paper and all associated questions/options/attempts via cascade.
 * @returns {Promise<void>}
 */
export const deleteQuestionPaper = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { paperId } = req.params as { paperId: string };
        if(!paperId?.trim()) {
            throw new BadRequestError("Paper ID is required.");
        }

        await prisma.questionPaper.delete({ where: { id: paperId } });
        
        res.status(200).json({
            success: true,
            message: "Question paper deleted successfully."
        });
    } catch (error) {
        next(error);
    }
};