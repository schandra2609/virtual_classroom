/**
 * @file testattempt.controller.ts
 * @module Controllers/Classroom/Examinations
 * @description Manages the execution and grading of examination attempts.
 * Implements logic for 'OFFICIAL' vs 'PRACTICE' modes, real-time answer
 * persistence, and automated scoring for MCQ, MSQ, and NAT questions.
 * @author Sayan Chandra
 */
import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.ts";
import {
    BadRequestError,
    ConflictError,
    ForbiddenError,
    NotFoundError,
} from "../utils/Error.ts";
import { prisma } from "../configs/database.config.ts";
import { dayjs } from "../configs/dayjs.config.ts";

/**
 * @async
 * @function startTestAttempt
 * @description Initializes a test session.
 * Logic:
 * 1. Checks if the current time falls within the 'Live' window of the Question Paper.
 * 2. If inside window: type is 'OFFICIAL'. If outside: type is 'PRACTICE'.
 * 3. Enforces a "One-Attempt" policy for OFFICIAL sessions to maintain exam integrity.
 * @param {AuthenticatedRequest} req - Params: { paperId }.
 * @returns {Promise<void>}
 */
export const startTestAttempt = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const { paperId } = req.params as { paperId: string };
        const studentId = req.user?.id as string;

        /** @section Validation Fix */
        if (!paperId?.trim()) {
            throw new BadRequestError("Paper ID is required.");
        }

        const questionPaper = await prisma.questionPaper.findUnique({
            where: { id: paperId },
        });
        if (!questionPaper) {
            throw new NotFoundError("Question paper not found.");
        }

        /** @section STATUS CHECK (Server Side Gate) */
        if (questionPaper.status === "SCHEDULED") {
            throw new ForbiddenError("Test has not started yet.");
        }
        if (questionPaper.status === "PAUSED") {
            throw new ForbiddenError(
                "Test is currently paused by the instructor.",
            );
        }
        if (questionPaper.status === "CANCELLED") {
            throw new ForbiddenError("Test has been cancelled.");
        }

        /** @section Temporal Logic */
        const now = dayjs();
        const liveAt = dayjs(questionPaper.liveAt);
        const endTime = liveAt.add(questionPaper.duration, "minute");
        const isOfficialWindow =
            questionPaper.status === "LIVE" && now.isBefore(endTime);
        const attemptType = isOfficialWindow ? "OFFICIAL" : "PRACTICE";

        /** @section Anti-Cheat: Official Attempt Enforcement */
        if (attemptType === "OFFICIAL") {
            const existing = await prisma.testAttempt.findFirst({
                where: {
                    studentId: studentId,
                    questionPaperId: paperId,
                    type: "OFFICIAL",
                },
            });
            if (existing) {
                throw new ConflictError(
                    "You have already completed your OFFICIAL attempt for this test.",
                );
            }
        }

        const newAttempt = await prisma.testAttempt.create({
            data: { type: attemptType, studentId, questionPaperId: paperId },
            include: { questionPaper: true },
        });
        res.status(201).json({
            success: true,
            data: newAttempt,
            message: `Started a new ${attemptType} test attempt`,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @async
 * @function submitAnswer
 * @description Persists a student's answer for a specific question.
 * Uses an 'Upsert' strategy to allow students to change their selection
 * multiple times before final submission.
 * @param {AuthenticatedRequest} req - Body: { questionId, selectedOptionId, numericalAnswer }.
 * @returns {Promise<void>}
 */
export const submitAnswer = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const { attemptId } = req.params as { attemptId: string };
        const studentId = req.user?.id as string;
        const { questionId, selectedOptionId, numericalAnswer } = req.body as {
            questionId: string;
            selectedOptionId?: string | string[];
            numericalAnswer?: number;
        };
        if (![attemptId, questionId].every((field) => field.trim())) {
            throw new BadRequestError(
                "Attempt ID, question ID are required fields.",
            );
        }

        const attempt = await prisma.testAttempt.findUnique({
            where: { id: attemptId },
            include: { questionPaper: true },
        });

        if (!attempt || attempt.studentId !== studentId) {
            throw new NotFoundError("Attempt not found or access denied.");
        }

        /** @section SERVER-SIDE TIMER & STATUS GUARD */
        if (attempt.type === "OFFICIAL") {
            const { status, liveAt, duration, pauseTime } =
                attempt.questionPaper;

            // 1. Check Manual Status
            if (status.toUpperCase() === "PAUSED")
                throw new ForbiddenError("Submission blocked: Test is paused.");
            if (status.toUpperCase() === "CANCELLED")
                throw new ForbiddenError("Submission blocked: Test cancelled.");
            if (status.toUpperCase() === "COMPLETED")
                throw new ForbiddenError("Submission blocked: Test ended.");

            // 2. Check Server Clock (Hard Deadline)
            const now = new Date().getTime();
            const start = new Date(liveAt).getTime();
            const durationMillis = duration * 60 * 1000;
            const adjustedDeadline = start + durationMillis + pauseTime;

            if (now > adjustedDeadline + 15000) {
                throw new ForbiddenError(
                    "Submission blocked: Time limit exceeded.",
                );
            }
        }

        /** @section STATUS CHECK (Server Side Gate) */
        if (attempt.submittedAt) {
            throw new BadRequestError("This test has already been submitted.");
        }

        /** @section Data Normalization */
        let normalizedOptionId: string | null = null;
        if (Array.isArray(selectedOptionId)) {
            normalizedOptionId = selectedOptionId.join(","); // Flatten MSQ array
        } else if (typeof selectedOptionId === "string") {
            normalizedOptionId = selectedOptionId;
        }

        if (
            normalizedOptionId === null &&
            (numericalAnswer === undefined || numericalAnswer === null)
        ) {
            throw new BadRequestError(
                "No valid answer provided (selection or numerical).",
            );
        }

        const savedAnswer = await prisma.answer.upsert({
            where: {
                testAttemptId_questionId: {
                    testAttemptId: attemptId,
                    questionId: questionId,
                },
            },
            update: {
                selectedOptionId: normalizedOptionId,
                numericalAnswer: numericalAnswer ?? null,
            },
            create: {
                testAttemptId: attemptId,
                questionId: questionId,
                selectedOptionId: normalizedOptionId,
                numericalAnswer: numericalAnswer ?? null,
            },
        });

        res.status(200).json({
            success: true,
            data: savedAnswer,
            message: "Answer synchronized successfully",
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @async
 * @function submitTestAttempt
 * @description Finalizes the test attempt and executes the grading algorithm.
 * **Grading Logic:**
 * 1. **NAT**: Exact numerical match.
 * 2. **MCQ**: Matches the single correct option ID.
 * 3. **MSQ**: Matches all correct option IDs (order-independent comparison).
 * @returns {Promise<void>}
 */
export const submitTestAttempt = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const { attemptId } = req.params as { attemptId: string };
        const studentId = req.user?.id as string;
        if (!attemptId.trim()) {
            throw new BadRequestError("Attempt ID is required.");
        }

        const attempt = await prisma.testAttempt.findFirst({
            where: {
                id: attemptId,
                studentId: studentId,
                submittedAt: null,
            },
            include: {
                answers: true,
                questionPaper: {
                    include: {
                        questions: {
                            include: { options: true },
                        },
                    },
                },
            },
        });
        if (!attempt) {
            throw new NotFoundError("Active test attempt not found.");
        }

        let totalScore = 0;

        /** @section Grading Algorithm Engine */
        for (const question of attempt.questionPaper.questions) {
            const studentAnswer = attempt.answers.find(
                (a) => a.questionId === question.id,
            );
            if (!studentAnswer) continue;

            let isCorrect = false;

            if (question.type.toUpperCase() === "NAT") {
                isCorrect =
                    studentAnswer.numericalAnswer ===
                    question.numericalCorrectAnswer;
            } else if (question.type.toUpperCase() === "MCQ") {
                const correctOption = question.options.find((o) => o.isCorrect);
                isCorrect =
                    studentAnswer.selectedOptionId === correctOption?.id;
            } else if (question.type.toUpperCase() === "MSQ") {
                const correctIds = question.options
                    .filter((o) => o.isCorrect)
                    .map((o) => o.id)
                    .sort();
                const studentIds = (studentAnswer.selectedOptionId || "")
                    .split(",")
                    .sort();
                isCorrect =
                    JSON.stringify(correctIds) === JSON.stringify(studentIds);
            }
            if (isCorrect) totalScore += question.marks;
        }

        const finalResult = await prisma.testAttempt.update({
            where: { id: attemptId },
            data: { score: totalScore, submittedAt: new Date() },
        });

        res.status(201).json({
            success: true,
            data: { score: totalScore, attemptId: finalResult.id },
            message: `Test submitted and graded successfully.`,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @async
 * @function getMyAttemptsForPaper
 * @description Retrieves the history of attempts (PRACTICE/OFFICIAL) for a specific paper.
 * @returns {Promise<void>}
 */
export const getMyAttemptsForPaper = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const { paperId } = req.params as { paperId: string };
        const studentId = req.user?.id as string;

        /** @section Validation Fix */
        if (!paperId?.trim()) {
            throw new BadRequestError("Paper ID is required.");
        }

        const attempts = await prisma.testAttempt.findMany({
            where: { studentId: studentId, questionPaperId: paperId },
            select: {
                id: true,
                type: true,
                score: true,
                submittedAt: true,
                createdAt: true,
            },
            orderBy: { createdAt: "desc" },
        });

        res.status(200).json({
            success: true,
            data: attempts,
            message:
                "Your test attempts for this paper retrieved successfully.",
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @async
 * @function getAttemptReview
 * @description Generates a comprehensive feedback report for a completed attempt.
 * Shows question text, student's input, and the correct answers.
 * @returns {Promise<void>}
 */
export const getAttemptReview = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const { attemptId } = req.params as { attemptId: string };
        const userId = req.user?.id as string;
        const userRole = req.membership?.role as string;
        if (!attemptId?.trim()) {
            throw new BadRequestError("Attempt ID is required.");
        }

        const attempt = await prisma.testAttempt.findUnique({
            where: { id: attemptId },
            include: {
                answers: true,
                questionPaper: {
                    include: {
                        questions: {
                            include: { options: true },
                        },
                    },
                },
            },
        });
        if (!attempt) {
            throw new NotFoundError("Test attempt not found.");
        }

        /** @section RBAC Logic: Ensure user is the owner or classroom staff */
        const isOwner = attempt.studentId === userId;
        const isTutor = ["CREATOR", "CO_TUTOR"].includes(userRole);
        if (!isOwner && !isTutor) {
            throw new ForbiddenError("Access denied.");
        }

        /** @section Feedback Map Generation */
        const reviewData = attempt.questionPaper.questions.map((q) => {
            const studentAns = attempt.answers.find(
                (a) => a.questionId === q.id,
            );
            return {
                id: q.id,
                text: q.text,
                type: q.type,
                marks: q.marks,
                correctAnswer:
                    q.type.toUpperCase() === "NAT"
                        ? q.numericalCorrectAnswer
                        : q.options.filter((o) => o.isCorrect).map((o) => o.id),
                studentAnswer:
                    q.type.toUpperCase() === "NAT"
                        ? studentAns?.numericalAnswer
                        : studentAns?.selectedOptionId, // MSQ returns csv string
                options: q.options.map((o) => ({
                    id: o.id,
                    text: o.text,
                    isCorrect: o.isCorrect,
                })),
            };
        });

        res.status(200).json({
            success: true,
            data: {
                title: attempt.questionPaper.title,
                score: attempt.score,
                details: reviewData,
            },
            message: "Test attempt review retrieved successfully",
        });
    } catch (error) {
        next(error);
    }
};
