/**
 * @file prompts.ts
 * @description Generates strict, context-aware prompts for the Gemini API.
 */
import { minioClient } from "../configs/minio.config.ts";
import { ENV_CONFIG } from "../configs/env.config.ts";

export interface QuestionRequirements {
    subject: string;
    mcqCount: number;
    msqCount: number;
    natCount: number;
    difficulty: string;
    customPrompt?: string;
    contextText?: string;
}

/**
 * Builds a deterministic prompt that forces Gemini to return a strict JSON array.
 */
export const buildQuestionGenerationPrompt = (req: QuestionRequirements): string => {
    const { subject, mcqCount, msqCount, natCount, difficulty, customPrompt, contextText } = req;
    const totalQuestions = mcqCount + msqCount + natCount;

    return `You are a strict JSON data generator. Your task is to write ${totalQuestions} questions about ${subject} at a ${difficulty} level.

${contextText ? `Use this material to generate the questions:\n${contextText.substring(0, 50000)}\n\n` : ""}
${customPrompt ? `Instructions: ${customPrompt}\n` : ""}

You must generate exactly:
- ${mcqCount} MCQ questions (1 correct option).
- ${msqCount} MSQ questions (multiple correct options).
- ${natCount} NAT questions (numerical answer, no options).

CRITICAL: You MUST output ONLY a valid JSON array. Do not include any other text. Follow this EXACT structure:
[
    {
        "type": "MCQ",
        "text": "What is the capital of France?",
        "options": [
            { "text": "Paris", "isCorrect": true },
            { "text": "London", "isCorrect": false },
            { "text": "New York", "isCorrect": false },
            { "text": "San Francisco", "isCorrect": false }
        ]
    },
    {
        "type": "MSQ",
        "text": "Which are from Europe continent?",
        "options": [
            { "text": "Paris", "isCorrect": true },
            { "text": "London", "isCorrect": true },
            { "text": "New York", "isCorrect": false },
            { "text": "San Francisco", "isCorrect": false }
        ]
    },
    {
        "type": "NAT",
        "text": "What is 5 + 5?",
        "numericalCorrectAnswer": 10
    }
]`;
};


/**
 * Streams an object from MinIO into a raw Node.js Buffer
 * (Preserved for internal bucket fetching without presigned URLs)
 */
export const getMinioObjectBuffer = async (objectPath: string): Promise<Buffer> => {
    const dataStream = await minioClient.getObject(ENV_CONFIG.MINIO.BUCKET, objectPath);
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        dataStream.on("data", (chunk) => chunks.push(chunk));
        dataStream.on("end", () => resolve(Buffer.concat(chunks)));
        dataStream.on("error", () => reject(new Error("Failed to retrieve document from storage.")));
    });
};