/**
 * @file assignment.controller.ts
 * @module Controllers/Classroom
 * @description Handles the business logic for classroom assignments.
 * Includes assignment creation by tutors, deadline management, and the
 * submission of solutions by students with object storage integration.
 * @author Sayan Chandra
 */
import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.ts";
import { dayjs } from "../configs/dayjs.config.ts";
import {
    BadRequestError,
    ForbiddenError,
    NotFoundError,
} from "../utils/Error.ts";
import { prisma } from "../configs/database.config.ts";
import { deleteFile, getPresignedUrl, uploadBuffer } from "../services/storage.service.ts";
import { sendMaterialNotification } from "../services/email.service.ts";
import { ENV_CONFIG } from "../configs/env.config.ts";
import { minioClient } from "../configs/minio.config.ts";

/**
 * @async
 * @function createAssignment
 * @description Creates a new assignment within a classroom.
 * Tutors can provide a title, instructions, a deadline, maxScore, and supporting documents.
 * @param {AuthenticatedRequest} req - Request containing classroomId in params and assignment details in body.
 * @param {Response} res - Success response with the created assignment object.
 * @param {NextFunction} next - Error propagation.
 */
export const createAssignment = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { classroomId } = req.params as { classroomId: string };
        const { title, instructions, deadline, maxScore } = req.body as {
            title: string;
            instructions: string;
            deadline: string;
            maxScore?: string | number; // Arrives as string via form-data
        };
        const authorId = req.user?.id as string;
        const files = req.files as Express.Multer.File[];
        
        if (![title, deadline].every((field) => field?.trim())) {
            throw new BadRequestError("Title and deadline are required to create an assignment.");
        }
        if (dayjs(deadline).isBefore(dayjs().add(30, "minute"))) {
            throw new BadRequestError("Assignment deadline must be after 30 minutes from current time.");
        }

        const parsedMaxScore = maxScore ? Number(maxScore) : 100;
        if (isNaN(parsedMaxScore) || parsedMaxScore <= 0) {
            throw new BadRequestError("Max score must be a valid positive number.");
        }

        const assignment = await prisma.$transaction(async (txn) => {
            const newAssignment = await txn.assignment.create({
                data: {
                    title: title.trim(),
                    instruction: instructions?.trim() || "",
                    deadline: dayjs(deadline).toDate(),
                    maxScore: parsedMaxScore,
                    classroomId: classroomId,
                    authorId: authorId,
                },
            });

            if (files && files.length > 0) {
                const attachmentData = await Promise.all(
                    files.map(async (file) => {
                        const storedPath = await uploadBuffer(
                            file.buffer,
                            file.originalname,
                            file.mimetype,
                            `classrooms/${classroomId}/assignments/${newAssignment.id}/`,
                        );
                        return {
                            url: storedPath,
                            fileName: file.originalname,
                            fileType: file.mimetype,
                            assignmentId: newAssignment.id,
                        };
                    }),
                );
                await txn.attachment.createMany({ data: attachmentData });
            }
            return txn.assignment.findUnique({
                where: { id: newAssignment.id },
                include: { classroom: { select: { name: true } } },
            });
        });

        res.status(201).json({
            success: true,
            data: assignment,
            message: "Assignment posted successfully.",
        });

        /** @section Email Notification (Async) */
        try {
            if (!assignment) return;
            const members = await prisma.classroomMember.findMany({
                where: { classroomId: classroomId, membershipStatus: "APPROVED" },
                include: { user: { select: { fullName: true, email: true } } },
            });

            const recipients = members
                .filter((m) => m.userId !== authorId)
                .map((m) => ({ name: m.user.fullName, email: m.user.email }));

            if (recipients.length > 0) {
                const dashboardUrl = `${ENV_CONFIG.CORS_ORIGIN[0]}/dashboard/classrooms/${classroomId}`;
                await sendMaterialNotification(
                    recipients,
                    "Assignment",
                    title,
                    assignment.classroom.name,
                    dashboardUrl,
                );
            }
        } catch (notifyError) {
            console.error("Failed to send assignment notifications:", notifyError);
        }
    } catch (error) {
        next(error);
    }
};

/**
 * @async
 * @function submitSolution
 * @description Allows students to submit their work for a specific assignment.
 * Enforces deadline restrictions and manages file transfers to MinIO.
 */
export const submitSolution = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const { assignmentId } = req.params as { assignmentId: string };
        const { content } = req.body as { content?: string };
        const studentId = req.user?.id as string;
        const files = req.files as Express.Multer.File[];

        if (!assignmentId?.trim()) {
            throw new BadRequestError("Assignment ID is required.");
        }
        if (!files || files.length === 0) {
            throw new BadRequestError("At least one file must be uploaded as a solution.");
        }

        const assignment = await prisma.assignment.findUnique({
            where: { id: assignmentId },
        });
        if (!assignment) {
            throw new NotFoundError("The specified assignment does not exist.");
        }

        if (dayjs().isAfter(dayjs(assignment.deadline))) {
            throw new ForbiddenError("Submission failed: The deadline for this assignment has passed.");
        }

        const submission = await prisma.$transaction(async (txn) => {
            const subRecord = await txn.submission.upsert({
                where: {
                    assignmentId_studentId: {
                        assignmentId: assignmentId,
                        studentId: studentId,
                    },
                },
                update: { content: content?.trim() ?? "", submittedAt: new Date() },
                create: {
                    assignmentId: assignmentId,
                    studentId: studentId,
                    content: content?.trim() ?? "",
                },
            });

            await txn.attachment.deleteMany({
                where: { submissionId: subRecord.id },
            });

            const attachmentData = await Promise.all(
                files.map(async (file) => {
                const storedPath = await uploadBuffer(
                    file.buffer,
                    file.originalname,
                    file.mimetype,
                    `submissions/${assignmentId}/${studentId}/`,
                );
                    return {
                        url: storedPath,
                        fileName: file.originalname,
                        fileType: file.mimetype,
                        submissionId: subRecord.id,
                    };
                }),
            );

            await txn.attachment.createMany({ data: attachmentData });
            return subRecord;
        });

        res.status(201).json({
            success: true,
            data: submission,
            message: "Assignment solution submitted successfully.",
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @async
 * @function updateAssignment
 * @description Updates assignment metadata or deadline.
 */
export const updateAssignment = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const { assignmentId } = req.params as { assignmentId: string };
        const { title, instructions, deadline, maxScore } = req.body as {
            title?: string;
            instructions?: string;
            deadline?: string;
            maxScore?: string | number;
        };
        if (!assignmentId?.trim()) {
            throw new BadRequestError("Assignment ID is required.");
        }
        if (![title, instructions, deadline, maxScore].some((field) => field !== undefined)) {
            throw new BadRequestError("Nothing to update.");
        }

        const updated = await prisma.assignment.update({
            where: { id: assignmentId },
            data: {
                ...(title && { title: title.trim() }),
                ...(instructions && { instruction: instructions.trim() }),
                ...(deadline && { deadline: dayjs(deadline).toDate() }),
                ...(maxScore !== undefined && { maxScore: Number(maxScore) }),
            },
        });

        res.status(200).json({
            success: true,
            data: updated,
            message: "Assignment updated successfully.",
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @async
 * @function deleteAssignment
 * @description Permanently removes an assignment and all associated student submissions.
 */
export const deleteAssignment = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
    try {
        const { assignmentId } = req.params as { assignmentId: string };
        const userId = req.user?.id;
        if (!assignmentId?.trim()) {
            throw new BadRequestError("Assignment ID is required.");
        }

        const assignment = await prisma.assignment.findUnique({
            where: { id: assignmentId },
            include: {
                attachments: true,
                submissions: {
                    include: { attachments: true },
                },
            },
        });

        if (!assignment) {
            throw new NotFoundError("Assignment not found.");
        }

        const isAuthor = assignment.authorId === userId;
        const isCreator = req.membership?.role === "CREATOR";
        if (!isAuthor && !isCreator) {
            throw new ForbiddenError("You do not have permission to cancel this assignment.");
        }

        const filesToDelete: string[] = [];
        assignment.attachments.forEach((att) => filesToDelete.push(att.url));
        assignment.submissions.forEach((sub) => {
            sub.attachments.forEach((att) => filesToDelete.push(att.url));
        });

        if (filesToDelete.length > 0) {
            await Promise.all(filesToDelete.map((url) => deleteFile(url)));
        }

        await prisma.assignment.delete({ where: { id: assignmentId } });

        res.status(200).json({
            success: true,
            message: "Assignment and all related student submissions have been permanently canceled.",
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @async
 * @function getClassroomAssignments
 * @description Retrieves all assignments for a classroom, including attachment details.
 */
export const getClassroomAssignments = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const { classroomId } = req.params as { classroomId: string };
        const userId = req.user?.id as string;

        if (!classroomId?.trim()) {
            throw new BadRequestError("Classroom ID is required.");
        }

        const assignments = await prisma.assignment.findMany({
            where: { classroomId },
            include: {
                attachments: true,
                author: { select: { fullName: true } },
                _count: { select: { submissions: true } },
                submissions: { where: { studentId: userId } }
            },
            orderBy: { createdAt: "desc" },
        });

        res.status(200).json({
            success: true,
            data: assignments,
            message: "Classroom assignments retrieved successfully.",
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @async
 * @function getAssignmentSubmissions
 * @description Returns all student submissions for a specific assignment.
 * Restrict to Tutors in the router layer.
 */
export const getAssignmentSubmissions = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const { assignmentId } = req.params as { assignmentId: string };
        if (!assignmentId?.trim()) {
            throw new BadRequestError("Assignment ID is required.");
        }

        const submissions = await prisma.submission.findMany({
            where: { assignmentId },
            include: {
                student: {
                    select: { fullName: true, email: true, profilePhotoUrl: true },
                },
                attachments: true,
            },
            orderBy: { submittedAt: "desc" },
        });

        const formattedSubmssions = await Promise.all(
            submissions.map(async (submission) => {
                const secureAttachments = await Promise.all(
                    submission.attachments.map(async (attachment) => {
                        try {
                            const cleanObjectPath = attachment.url.replace(/^https?:\/\/[^\/]+\/[^\/]+\//, '');
                            const presignedUrl = await getPresignedUrl(cleanObjectPath);
                            return {
                                ...attachment,
                                url: presignedUrl, 
                            };
                        } catch (err) {
                            console.error(`Presigned URL generation failed for ${attachment.url}`, err);
                            return attachment; 
                        }
                    })
                );

                return {
                    ...submission,
                    attachments: secureAttachments,
                };
            })
        );

        res.status(200).json({
            success: true,
            data: formattedSubmssions,
            message: "Student submissions retrieved successfully.",
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @async
 * @function gradeSubmission
 * @description Allows a Tutor to grade a specific student submission.
 */
export const gradeSubmission = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const { submissionId } = req.params as { submissionId: string };
        const { marksObtained } = req.body as { marksObtained: number | string };

        if (!submissionId?.trim()) {
            throw new BadRequestError("Submission ID is required.");
        }

        const parsedMarks = Number(marksObtained);
        if (isNaN(parsedMarks) || parsedMarks < 0) {
            throw new BadRequestError("Marks must be a valid positive number.");
        }

        // Fetch submission and related assignment to validate against maxScore
        const submission = await prisma.submission.findUnique({
            where: { id: submissionId },
            include: { assignment: true }
        });

        if (!submission) {
            throw new NotFoundError("The specified submission does not exist.");
        }

        if (parsedMarks > submission.assignment.maxScore) {
            throw new BadRequestError(`Marks cannot exceed the maximum score of ${submission.assignment.maxScore}.`);
        }

        const updatedSubmission = await prisma.submission.update({
            where: { id: submissionId },
            data: { marksObtained: parsedMarks }
        });

        res.status(200).json({
            success: true,
            data: updatedSubmission,
            message: "Grade saved successfully.",
        });
    } catch (error) {
        next(error);
    }
};