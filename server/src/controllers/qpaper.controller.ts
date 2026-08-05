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
import { BadRequestError, NotFoundError } from "../utils/Error.ts";
import { prisma } from "../configs/database.config.ts";
import { dayjs } from "../configs/dayjs.config.ts";
import { notifyTestStatusChange } from "../services/socket.service.ts";
import Helper from "../utils/Helper.ts";

/**
 * @async
 * @function getAllQuestionPapers
 * @description Retrieves a list of question papers within a classroom.
 */
export const getAllQuestionPapers = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const { classroomId } = req.params as { classroomId: string };
        const userRole = req.membership?.role as string;
        if (!classroomId?.trim() || !userRole?.trim()) {
            throw new BadRequestError("Classroom ID, user role are required.");
        }

        const whereClause: any = { classroomId: classroomId };
        if (userRole === "STUDENT") {
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
                creatorId: true,
                status: true,
            },
            orderBy: { liveAt: "desc" },
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
 */
export const createQuestionPaper = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const { classroomId } = req.params as { classroomId: string };
        const creatorId = req.user?.id as string;
        
        const { title, liveAt, duration } = req.body as {
            title: string;
            liveAt: string;
            duration: number | string;
        };

        if (
            !creatorId?.trim() || 
            !classroomId?.trim() || 
            !title?.trim() || 
            !liveAt?.trim() || 
            duration === undefined || 
            duration === null
        ) {
            throw new BadRequestError(
                "Classroom ID, creator ID, title, duration, live at fields are required.",
            );
        }

        const liveAtDate = dayjs(liveAt);
        if (!liveAtDate.isValid() || liveAtDate.isBefore(dayjs())) {
            throw new BadRequestError("Invalid or expired date time.");
        }

        const newPaper = await prisma.questionPaper.create({
            data: {
                title: title,
                liveAt: liveAtDate.toDate(),
                duration: Number(duration),
                classroomId: classroomId,
                creatorId: creatorId,
                status: "SCHEDULED",
            },
        });
        res.status(201).json({
            success: true,
            data: newPaper,
            message: "Question paper created.",
        });
    } catch (error: any) {
        if (error.code === "P2003") {
            return next(new NotFoundError("The specified classroom does not exist."));
        }
        next(error);
    }
};

/**
 * @async
 * @function getQuestionPaperById
 * @description Retrieves a full question paper including questions and options.
 */
export const getQuestionPaperById = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const { paperId } = req.params as { paperId: string };
        const userAccountType = req.user?.accountType as string;
        if (!paperId?.trim() || !userAccountType?.trim()) {
            throw new BadRequestError("Missing values: paper id, user");
        }

        const questionPaper = await prisma.questionPaper.findUnique({
            where: { id: paperId },
            include: { questions: { include: { options: true } } },
        });
        if (!questionPaper) {
            throw new NotFoundError("Question paper not found.");
        }

        const sanitizedPaper =
            userAccountType === "STUDENT"
                ? {
                      ...questionPaper,
                      questions: questionPaper.questions.map((q) => {
                          if (q.numericalCorrectAnswer !== null) {
                              const { numericalCorrectAnswer, ...rest } = q;
                              return rest;
                          }
                          return {
                              ...q,
                              options: q.options.map(
                                  ({ isCorrect, ...option }) => option,
                              ),
                          };
                      }),
                  }
                : questionPaper;

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
 * @description Updates existing paper metadata. Enforces pre-live edit constraints.
 */
export const updateQuestionPaper = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const { paperId } = req.params as { paperId: string };
        const { title, liveAt, duration, negativeMarkingEnabled } = req.body as {
            title?: string;
            liveAt?: string;
            duration?: number | string;
            negativeMarkingEnabled?: boolean;
        };
        if (!paperId?.trim()) {
            throw new BadRequestError("Paper ID is required.");
        }

        // TIME CHECK: Cannot edit a paper that is already live
        const existingPaper = await prisma.questionPaper.findUnique({ where: { id: paperId } });
        if (!existingPaper) throw new NotFoundError("Question paper not found.");
        if (new Date() >= existingPaper.liveAt) {
            throw new BadRequestError("Cannot edit an exam that has already started or concluded.");
        }

        const dataToUpdate: any = {};
        if (title) dataToUpdate.title = title;
        if (duration) dataToUpdate.duration = Number(duration);
        if (negativeMarkingEnabled !== undefined) dataToUpdate.negativeMarking = Boolean(negativeMarkingEnabled);
        if (liveAt) {
            const liveAtDate = dayjs(liveAt);
            if (!liveAtDate.isValid()) throw new BadRequestError("Invalid date.");
            dataToUpdate.liveAt = liveAtDate.toDate();
        }
        if (Object.keys(dataToUpdate).length === 0) throw new BadRequestError("Nothing to update.");

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
 * @description Deletes a paper via cascade. Enforces pre-live constraints.
 */
export const deleteQuestionPaper = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const { paperId } = req.params as { paperId: string };
        if (!paperId?.trim()) {
            throw new BadRequestError("Paper ID is required.");
        }

        // TIME CHECK: Cannot delete a paper that is already live
        const existingPaper = await prisma.questionPaper.findUnique({ where: { id: paperId } });
        if (!existingPaper) throw new NotFoundError("Question paper not found.");
        if (new Date() >= existingPaper.liveAt) {
            throw new BadRequestError("Cannot delete an exam that has already started or concluded.");
        }

        await prisma.questionPaper.delete({ where: { id: paperId } });

        res.status(200).json({
            success: true,
            message: "Question paper deleted successfully.",
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @async
 * @function changePaperStatus
 */
export const changePaperStatus = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const { paperId } = req.params as { paperId: string };
        const { status } = req.body as { status: string };

        const validStatuses = ["LIVE", "PAUSED", "CANCELLED", "COMPLETED"];
        if (!validStatuses.includes(status.toUpperCase())) {
            throw new BadRequestError("Invalid status.");
        }

        const paper = await prisma.questionPaper.findUnique({
            where: { id: paperId },
        });
        if (!paper) throw new NotFoundError("Paper not found");

        const now = new Date();
        
        // TIME CHECK: Cannot cancel an exam if the duration has already expired
        if (status.toUpperCase() === "CANCELLED") {
            const deadline = Helper.calculateDeadline(paper);
            if (now >= deadline) {
                throw new BadRequestError("Cannot cancel an exam that has already concluded.");
            }

            await prisma.questionPaper.delete({ where: { id: paperId } });
            notifyTestStatusChange(paper.classroomId, paperId, "CANCELLED");

            res.status(200).json({
                success: true,
                message: "Test cancelled.",
            });
            return;
        }

        const dataToUpdate: any = { status: status };

        if (status === "PAUSED" && paper.status === "LIVE") {
            dataToUpdate.lastPausedAt = now;
        }

        if (status === "LIVE" && paper.status === "PAUSED" && paper.lastPausedAt) {
            const pauseDuration = now.getTime() - new Date(paper.lastPausedAt).getTime();
            dataToUpdate.pauseTime = { increment: pauseDuration };
            dataToUpdate.lastPausedAt = null;
        }

        const updatedPaper = await prisma.questionPaper.update({
            where: { id: paperId },
            data: dataToUpdate,
        });

        notifyTestStatusChange(paper.classroomId, paperId, status.toUpperCase());

        res.status(200).json({
            success: true,
            data: {
                status: updatedPaper.status,
                adjustedDeadline: Helper.calculateDeadline(updatedPaper),
            },
            message: `Test status updated to ${status.toUpperCase()}`,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @async
 * @function getTimerSync
 */
export const getTimerSync = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const { paperId } = req.params as { paperId: string };

        const paper = await prisma.questionPaper.findUnique({
            where: { id: paperId },
            select: {
                liveAt: true,
                duration: true,
                pauseTime: true,
                status: true,
                lastPausedAt: true,
            },
        });

        if (!paper) throw new NotFoundError("Paper not found");

        const deadline = Helper.calculateDeadline(paper);
        const now = new Date();
        let remainingMillis = 0;

        if (paper.status === "PAUSED" && paper.lastPausedAt) {
            const effectiveNow = paper.lastPausedAt;
            remainingMillis = deadline.getTime() - effectiveNow.getTime();
        } else {
            remainingMillis = deadline.getTime() - now.getTime();
        }

        res.status(200).json({
            success: true,
            data: {
                status: paper.status,
                remainingSeconds: Math.max(0, Math.floor(remainingMillis / 1000)),
                serverTime: now,
            },
        });
    } catch (error) {
        next(error);
    }
};