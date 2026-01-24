import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.ts";
import type { Option, QuestionType } from "../../generated/prisma/client.ts";
import { BadRequestError } from "../errors/handler.error.ts";
import { prisma } from "../configs/database.config.ts";

export const addQuestion = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { paperId } = req.params as { paperId: string };
        const { text, type, marks, options, numericalCorrectAnswer } = req.body as { text: string, type: QuestionType, marks: number, options: Option[], numericalCorrectAnswer: number };
        if(![paperId, text, type].every((field) => field.trim())) {
            throw new BadRequestError("Paper ID, text, type fields are required.");
        }
        if(typeof marks !== "number" || Number.isNaN(marks) || marks <= 0) {
            throw new BadRequestError("Marks must be a valid number.");
        }
        if (!["MCQ", "MSQ", "NAT"].includes(type.toUpperCase())) {
            throw new BadRequestError("Invalid question type specified");
        }
        if (type.toUpperCase() === "NAT" && numericalCorrectAnswer === undefined) {
            throw new BadRequestError("numericalCorrectAnswer is required for NAT questions");
        }
        if(type.toUpperCase() === "NAT" && (typeof numericalCorrectAnswer !== "number" || Number.isNaN(numericalCorrectAnswer))) {
            throw new BadRequestError("Invalid answer for an NAT question.");
        }
        if (['MCQ', 'MSQ'].includes(type.toUpperCase()) && (!Array.isArray(options) || options.length < 2)) {
            throw new BadRequestError("At least two options are required for MCQ/MSQ questions");
        }
        if (type.toUpperCase() === 'MCQ' && options.filter(opt => opt.isCorrect).length !== 1) {
            throw new BadRequestError("Exactly one option must be marked as correct for MCQ questions.");
        }

        const newQuestion = await prisma.$transaction(async (txn) => {
            const question = await txn.question.create({
                data: {
                    text: text,
                    type: type,
                    marks: marks,
                    numericalCorrectAnswer: type === "NAT" ? numericalCorrectAnswer : null,
                    qpaper: { connect: { id: paperId } },
                },
            });
            if (options && ["MCQ", "MSQ"].includes(type.toUpperCase())) {
                await txn.option.createMany({
                    data: options.map(opt => ({
                        text: opt.text,
                        isCorrect: opt.isCorrect || false,
                        questionId: question.id,
                    })),
                });
            }
            return txn.question.findUnique({
                where: { id: question.id },
                include: { options: true },
            });
        });

        res.status(201).json({
            success: true, 
            data: newQuestion,
            message: "Question added successfully.",
        });
    } catch (error) {
        next(error);
    }
};

export const updateQuestion = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { questionId } = req.params as { questionId: string };
        const { text, marks } = req.body as Partial<{ text: string, marks: number }>;
        if(!questionId?.trim()) {
            throw new BadRequestError("Question ID is required");
        }
        if(!text?.trim() && (typeof marks !== "number" || Number.isNaN(marks) || marks <= 0)) {
            throw new BadRequestError("Invalid update data provided.");
        }

        const dataToUpdate: { text?: string, marks?: number } = {};
        if(text !== undefined && text?.trim()) dataToUpdate.text = text.trim();
        if(marks !== undefined && (typeof marks !== "number" || Number.isNaN(marks) || marks <= 0)) dataToUpdate.marks = marks;
        const updatedQuestion = await prisma.question.update({
            where: { id: questionId },
            data: dataToUpdate,
        });

        res.status(200).json({
            success: true,
            data: updatedQuestion,
            message: "Question updated.",
        });
    } catch (error) { next(error); }
};

export const deleteQuestion = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { questionId } = req.params as { questionId: string };
        if(!questionId?.trim()) {
            throw new BadRequestError("Question ID is required.");
        }
        
        await prisma.question.delete({ where: { id: questionId } });

        res.status(200).json({
            success: true,
            message: "Question deleted successfully.",
        });
    } catch (error) { next(error); }
};