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
import { BadRequestError } from "../utils/Error.ts";
import { prisma } from "../configs/database.config.ts";
import { buildQuestionGenerationPrompt, getMinioObjectBuffer } from "../utils/prompts.ts";
import { genaiService } from "../services/genai.service.ts";
import { PDFParse } from "pdf-parse";

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
export const addQuestion = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const { paperId } = req.params as { paperId: string };
        const { text, type, marks, options, numericalCorrectAnswer } =
            req.body as {
                text: string;
                type: QuestionType;
                marks: number;
                options: Option[];
                numericalCorrectAnswer: number;
            };

        /** @section Basic Field Validation */
        if (![paperId, text, type].every((field) => field.trim())) {
            throw new BadRequestError(
                "Paper ID, text, type fields are required.",
            );
        }
        if (typeof marks !== "number" || Number.isNaN(marks) || marks <= 0) {
            throw new BadRequestError("Marks must be a valid number.");
        }
        if (!["MCQ", "MSQ", "NAT"].includes(type.toUpperCase())) {
            throw new BadRequestError("Invalid question type specified");
        }

        /** @section Business Rule Validation */
        // Validation for Numerical Answer Type
        if (
            type.toUpperCase() === "NAT" &&
            numericalCorrectAnswer === undefined
        ) {
            throw new BadRequestError(
                "numericalCorrectAnswer is required for NAT questions",
            );
        }
        if (
            type.toUpperCase() === "NAT" &&
            (typeof numericalCorrectAnswer !== "number" ||
                Number.isNaN(numericalCorrectAnswer))
        ) {
            throw new BadRequestError("Invalid answer for an NAT question.");
        }

        // Validation for Option-based questions (MCQ/MSQ)
        if (
            ["MCQ", "MSQ"].includes(type.toUpperCase()) &&
            (!Array.isArray(options) || options.length < 2)
        ) {
            throw new BadRequestError(
                "At least two options are required for MCQ/MSQ questions",
            );
        }
        if (
            type.toUpperCase() === "MCQ" &&
            options.filter((opt) => opt.isCorrect).length !== 1
        ) {
            throw new BadRequestError(
                "Exactly one option must be marked as correct for MCQ questions.",
            );
        }

        /** @section Atomic Database Operation */
        const newQuestion = await prisma.$transaction(async (txn) => {
            // 1. Create the Question record
            const question = await txn.question.create({
                data: {
                    text: text,
                    type: type,
                    marks: marks,
                    numericalCorrectAnswer:
                        type === "NAT" ? numericalCorrectAnswer : null,
                    qpaper: { connect: { id: paperId } },
                },
            });

            // 2. Create Options if applicable
            if (options && ["MCQ", "MSQ"].includes(type.toUpperCase())) {
                await txn.option.createMany({
                    data: options.map((opt) => ({
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
export const updateQuestion = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const { questionId } = req.params as { questionId: string };
        const { text, marks } = req.body as Partial<{
            text: string;
            marks: number;
        }>;
        if (!questionId?.trim()) {
            throw new BadRequestError("Question ID is required");
        }
        if (
            !text?.trim() &&
            (typeof marks !== "number" || Number.isNaN(marks) || marks <= 0)
        ) {
            throw new BadRequestError("Invalid update data provided.");
        }

        /** @section Partial Update Logic */
        const dataToUpdate: { text?: string; marks?: number } = {};
        if (text !== undefined && text?.trim()) dataToUpdate.text = text.trim();
        // Only add marks if it's a valid positive number
        if (
            marks !== undefined &&
            typeof marks === "number" &&
            !Number.isNaN(marks) &&
            marks > 0
        )
            dataToUpdate.marks = marks;
        if (Object.keys(dataToUpdate).length === 0) {
            throw new BadRequestError(
                "No valid update data provided (ensure text is non-empty and marks > 0).",
            );
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
export const deleteQuestion = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const { questionId } = req.params as { questionId: string };
        if (!questionId?.trim()) {
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

/**
 * @async
 * @function generateAIQuestions
 * @description Downloads selected files, parses text via pdf-parse, 
 * constructs a context-aware prompt, and routes it through Ollama.
 */
export const generateAIQuestions = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { paperId } = req.params;
        const { 
            subject,
            contextFiles = [], 
            difficulty = "Medium", 
            config, 
            customPrompt 
        } = req.body;

        if (!subject?.trim()) {
            throw new BadRequestError("Subject/Topic is required to generate questions.");
        }

        const mcqCount = config?.mcq?.count || 0;
        const msqCount = config?.msq?.count || 0;
        const natCount = config?.nat?.count || 0;
        const totalQuestions = mcqCount + msqCount + natCount;

        if (totalQuestions === 0) {
            throw new BadRequestError("You must request at least one question to generate.");
        }

        // 1. Fetch URLs, convert to Buffers, and Extract Text
        let combinedExtractedText = "";
        
        if (Array.isArray(contextFiles) && contextFiles.length > 0) {
            for (const url of contextFiles) {
                try {
                    const fileRes = await fetch(url);
                    if (!fileRes.ok) throw new Error(`Failed to fetch file at ${url}`);
                    const arrayBuffer = await fileRes.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);
                    
                    // Parse text from the PDF buffer
                    const parser = new PDFParse({ data: buffer });
                    const parsedPdf = await parser.getText();
                    combinedExtractedText += `\n--- Document ---\n${parsedPdf.text}\n`;
                    await parser.destroy();
                } catch (error) {
                    console.error("Failed to download or parse context file:", error);
                    // Skip broken files but continue with the rest to avoid failing the whole request
                }
            }
        }

        // 2. Build the precise prompt with the extracted text
        const prompt = buildQuestionGenerationPrompt({
            subject,
            mcqCount,
            msqCount,
            natCount,
            difficulty,
            customPrompt,
            contextText: combinedExtractedText.trim()
        });

        // 3. Request generation from Ollama (passing empty buffer array as Llama3 uses prompt text)
        let generatedQuestions = await genaiService.generateQuestions(prompt);

        if (!Array.isArray(generatedQuestions) && generatedQuestions !== null && typeof generatedQuestions === "object") {
            console.log("AI wrapped response in an object. Normalizing data structure...");
            
            // Look for any key that holds an array (like "questions", "test_bank", "data", etc.)
            const implicitArrayKey = Object.keys(generatedQuestions).find(
                (key) => Array.isArray((generatedQuestions as any)[key])
            );
            
            if (implicitArrayKey) {
                generatedQuestions = (generatedQuestions as any)[implicitArrayKey];
            } else {
                // If it's a single question object instead of an array, wrap it in an array
                generatedQuestions = [generatedQuestions];
            }
        }

        // Final safety fallback
        if (!Array.isArray(generatedQuestions)) {
            throw new Error("AI failed to provide questions in a recognizable list layout.");
        }
        
        // 4. Post-processing: Inject the marks designated by the tutor
        generatedQuestions = generatedQuestions.map((q: any) => {
            let assignedMarks = 1;
            // Support both uppercase from prompt or lowercase variants from smaller models safely
            const typeUpper = String(q.type || q.question_type || "").toUpperCase();
            
            if (typeUpper === "MCQ") assignedMarks = config?.mcq?.marks || 1;
            if (typeUpper === "MSQ") assignedMarks = config?.msq?.marks || 1;
            if (typeUpper === "NAT") assignedMarks = config?.nat?.marks || 1;
            
            return {
                text: q.text || q.question || "", // Map 'question' to 'text' if model used standard naming
                type: typeUpper === "MCQ" || typeUpper === "MSQ" || typeUpper === "NAT" ? typeUpper : "MCQ",
                options: Array.isArray(q.options) ? q.options.map((o: any) => {
                    // Check if option is a string or an object to map to the editor seamlessly
                    if (typeof o === "string") {
                        return { text: o, isCorrect: String(q.answer).toUpperCase() === o.toUpperCase() };
                    }
                    return { text: o.text || "", isCorrect: !!o.isCorrect };
                }) : [],
                numericalCorrectAnswer: q.numericalCorrectAnswer !== undefined ? q.numericalCorrectAnswer : q.answer,
                marks: assignedMarks
            };
        });

        res.status(200).json({
            success: true,
            data: generatedQuestions,
            message: `Successfully generated ${generatedQuestions.length} AI questions.`
        });
    } catch (error) {
        next(error);
    }
};