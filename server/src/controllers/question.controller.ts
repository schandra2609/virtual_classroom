/**
 * @file question.controller.ts
 * @module Controllers/Classroom/Questions
 * @description Controller responsible for managing the individual questions within a 
 * Question Paper. Supports multiple question formats: Multiple Choice (MCQ), 
 * Multiple Select (MSQ), and Numerical Answer Type (NAT).
 * @author Sayan Chandra
 */
import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.ts";
import type { Option, QuestionType } from "../../generated/prisma/client.ts";
import { BadRequestError } from "../errors/handler.error.ts";
import { prisma } from "../configs/database.config.ts";

/**
 * @async
 * @function addQuestion
 * @description Appends a new question to a specific question paper.
 * **Validation Logic per Type:**
 * 1. **NAT**: Requires a `numericalCorrectAnswer`.
 * 2. **MCQ**: Requires at least 2 options and exactly 1 marked as correct.
 * 3. **MSQ**: Requires at least 2 options and at least 1 marked as correct.
 * @param {AuthenticatedRequest} req - Request containing paperId in params and question details in body.
 * @param {Response} res - Success response with the created question and its options.
 * @param {NextFunction} next - Error propagation.
 * @throws {BadRequestError} 400 - If validation for the specific question type fails.
 * @returns {Promise<void>}
 */
export const addQuestion = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { paperId } = req.params as { paperId: string };
        const { text, type, marks, options, numericalCorrectAnswer } = req.body as { text: string, type: QuestionType, marks: number, options: Option[], numericalCorrectAnswer: number };
        
        /** @section Basic Field Validation */
        if(![paperId, text, type].every((field) => field.trim())) {
            throw new BadRequestError("Paper ID, text, type fields are required.");
        }
        if(typeof marks !== "number" || Number.isNaN(marks) || marks <= 0) {
            throw new BadRequestError("Marks must be a valid number.");
        }
        if (!["MCQ", "MSQ", "NAT"].includes(type.toUpperCase())) {
            throw new BadRequestError("Invalid question type specified");
        }

        /** @section Business Rule Validation */
        // Validation for Numerical Answer Type
        if (type.toUpperCase() === "NAT" && numericalCorrectAnswer === undefined) {
            throw new BadRequestError("numericalCorrectAnswer is required for NAT questions");
        }
        if(type.toUpperCase() === "NAT" && (typeof numericalCorrectAnswer !== "number" || Number.isNaN(numericalCorrectAnswer))) {
            throw new BadRequestError("Invalid answer for an NAT question.");
        }

        // Validation for Option-based questions (MCQ/MSQ)
        if (['MCQ', 'MSQ'].includes(type.toUpperCase()) && (!Array.isArray(options) || options.length < 2)) {
            throw new BadRequestError("At least two options are required for MCQ/MSQ questions");
        }
        if (type.toUpperCase() === 'MCQ' && options.filter(opt => opt.isCorrect).length !== 1) {
            throw new BadRequestError("Exactly one option must be marked as correct for MCQ questions.");
        }

        /** @section Atomic Database Operation */
        const newQuestion = await prisma.$transaction(async (txn) => {
            // 1. Create the Question record
            const question = await txn.question.create({
                data: {
                    text: text,
                    type: type,
                    marks: marks,
                    numericalCorrectAnswer: type === "NAT" ? numericalCorrectAnswer : null,
                    qpaper: { connect: { id: paperId } },
                },
            });

            // 2. Create Options if applicable
            if (options && ["MCQ", "MSQ"].includes(type.toUpperCase())) {
                await txn.option.createMany({
                    data: options.map(opt => ({
                        text: opt.text,
                        isCorrect: opt.isCorrect || false,
                        questionId: question.id,
                    })),
                });
            }

            // 3. Return full object with created options
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

/**
 * @async
 * @function updateQuestion
 * @description Performs a partial update on a question's text or marks.
 * @param {AuthenticatedRequest} req - Request containing questionId in params.
 * @throws {BadRequestError} 400 - If the update payload is invalid or empty.
 * @returns {Promise<void>}
 */
export const updateQuestion = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { questionId } = req.params as { questionId: string };
        const { text, marks } = req.body as Partial<{ text: string, marks: number }>;
        if(!questionId?.trim()) {
            throw new BadRequestError("Question ID is required");
        }
        if(!text?.trim() && (typeof marks !== "number" || Number.isNaN(marks) || marks <= 0)) {
            throw new BadRequestError("Invalid update data provided.");
        }

        /** @section Partial Update Logic */
        const dataToUpdate: { text?: string, marks?: number } = {};
        if(text !== undefined && text?.trim()) dataToUpdate.text = text.trim();
        // Only add marks if it's a valid positive number
        if(marks !== undefined && typeof marks === "number" && !Number.isNaN(marks) && marks > 0) dataToUpdate.marks = marks;
        if (Object.keys(dataToUpdate).length === 0) {
            throw new BadRequestError("No valid update data provided (ensure text is non-empty and marks > 0).");
        }

        const updatedQuestion = await prisma.question.update({
            where: { id: questionId },
            data: dataToUpdate,
        });

        res.status(200).json({
            success: true,
            data: updatedQuestion,
            message: "Question updated.",
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @async
 * @function deleteQuestion
 * @description Permanently deletes a question. 
 * Cascading logic in the database ensures associated options and answers are also removed.
 * @param {AuthenticatedRequest} req - Request containing questionId in params.
 * @returns {Promise<void>}
 */
export const deleteQuestion = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
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
    } catch (error) {
        next(error);
    }
};