import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.ts";
import { BadRequestError, NotFoundError } from "../errors/handler.error.ts";
import { prisma } from "../configs/database.config.ts";
import { dayjs } from "../configs/dayjs.config.ts";

export const getAllQuestionPapers = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { classroomId } = req.params as { classroomId: string };
        const userRole = req.membership?.role as string;
        if(![classroomId, userRole].every((field) => field.trim())) {
            throw new BadRequestError("Classroom ID, user role are required.");
        }

        const whereClause: any = { classroomId: classroomId };
        if(userRole === "STUDENT") {
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

export const createQuestionPaper = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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

export const getQuestionPaperById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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
                                        if(q.numericalCorrectAnswer !== null) {
                                            const { numericalCorrectAnswer, ...rest } = q;
                                            return rest;
                                        }
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

export const updateQuestionPaper = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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

export const deleteQuestionPaper = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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