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
  UnauthorizedError,
} from "../errors/handler.error.ts";
import { prisma } from "../configs/database.config.ts";
import { deleteFile, uploadBuffer } from "../services/storage.service.ts";
import { sendMaterialNotification } from "../services/email.service.ts";
import { ENV_CONFIG } from "../configs/env.config.ts";

/**
 * @async
 * @function createAssignment
 * @description Creates a new assignment within a classroom.
 * Tutors can provide a title, instructions, a deadline, and supporting documents.
 *
 * @param {AuthenticatedRequest} req - Request containing classroomId in params and assignment details in body.
 * @param {Response} res - Success response with the created assignment object.
 * @param {NextFunction} next - Error propagation.
 */
export const createAssignment = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { classroomId } = req.params as { classroomId: string };
    const { title, instructions, deadline } = req.body as {
      title: string;
      instructions: string;
      deadline: string;
    };
    const authorId = req.user?.id as string;
    const files = req.files as Express.Multer.File[];
    if (![title, deadline].every((field) => field?.trim())) {
      throw new BadRequestError(
        "Title and deadline are required to create an assignment.",
      );
    }
    if (dayjs(deadline).isBefore(dayjs().add(30, "minute"))) {
      throw new BadRequestError(
        "Assignment deadline must be after 30 minutes from current time.",
      );
    }

    const assignment = await prisma.$transaction(async (txn) => {
      const newAssignment = await txn.assignment.create({
        data: {
          title: title.trim(),
          instruction: instructions?.trim() || "",
          deadline: dayjs(deadline).toDate(),
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
      message: "Assignment posted successfuly.",
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
        const dashboardUrl = `${ENV_CONFIG.CORS_ORIGIN[0]}/dashboard/classroom/${classroomId}/assignments/${assignment.id}`;
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
 * @param {AuthenticatedRequest} req - Request containing assignmentId in params and files in body.
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

    if (!assignmentId?.trim())
      throw new BadRequestError("Assignment ID is required.");
    if (!files || files.length === 0)
      throw new BadRequestError(
        "At least one file must be uploaded as a solution.",
      );

    // Fetch assignment to verify existence and check deadline
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
    });
    if (!assignment)
      throw new NotFoundError("The specified assignment does not exist.");

    if (dayjs().isAfter(dayjs(assignment.deadline))) {
      throw new ForbiddenError(
        "Submission failed: The deadline for this assignment has passed.",
      );
    }

    const submission = await prisma.$transaction(async (txn) => {
      // 1. Upsert Submission (Allows students to re-submit/update their solution)
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

      // 2. Clear old attachments if re-submitting (Optional choice for a cleaner storage)
      await txn.attachment.deleteMany({
        where: { submissionId: subRecord.id },
      });

      // 3. Upload new attachments
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
 * Usually performed by Tutors in case of schedule changes.
 */
export const updateAssignment = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { assignmentId } = req.params as { assignmentId: string };
    const { title, instructions, deadline } = req.body as {
      title?: string;
      instructions?: string;
      deadline?: string;
    };
    if (!assignmentId?.trim())
      throw new BadRequestError("Assignment ID is required.");
    if (![title, instructions, deadline].some((field) => field?.trim())) {
      throw new BadRequestError("Nothing to update.");
    }

    const updated = await prisma.assignment.update({
      where: { id: assignmentId },
      data: {
        ...(title && { title: title.trim() }),
        ...(instructions && { instruction: instructions.trim() }),
        ...(deadline && { deadline: dayjs(deadline).toDate() }),
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
 * Logic:
 * 1. Verifies the assignment existence.
 * 2. Authenticates that the requester is the author or classroom creator.
 * 3. Iterates through all attachments (from both the assignment and student submissions)
 *    and deletes them from MinIO storage.
 * 4. Removes the records from PostgreSQL.
 */
export const deleteAssignment = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { assignmentId } = req.params as { assignmentId: string };
    const userId = req.user?.id;
    if (!assignmentId?.trim())
      throw new BadRequestError("Assignment ID is required.");

    // Fetch assignment with all nested attachments (including those in submissions)
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        attachments: true,
        submissions: {
          include: { attachments: true },
        },
      },
    });

    if (!assignment) throw new NotFoundError("Assignment not found.");

    // Security: Only the original author or a classroom creator can delete/cancel
    const isAuthor = assignment.authorId === userId;
    const isCreator = req.membership?.role === "CREATOR";
    if (!isAuthor && !isCreator) {
      throw new ForbiddenError(
        "You do not have permission to cancel this assignment.",
      );
    }

    /** @section Storage Cleanup */
    // Collect all file URLs to delete from MinIO
    const filesToDelete: string[] = [];

    // 1. Assignment's own instructions/files
    assignment.attachments.forEach((att) => filesToDelete.push(att.url));

    // 2. All student submission files
    assignment.submissions.forEach((sub) => {
      sub.attachments.forEach((att) => filesToDelete.push(att.url));
    });

    // Execute batch deletion from MinIO
    if (filesToDelete.length > 0) {
      await Promise.all(filesToDelete.map((url) => deleteFile(url)));
    }

    /** @section Database Deletion */
    // Cascade delete in Prisma schema will automatically remove Attachments and Submissions
    await prisma.assignment.delete({ where: { id: assignmentId } });

    res.status(200).json({
      success: true,
      message:
        "Assignment and all related student submissions have been permanently canceled.",
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
    if (!classroomId?.trim())
      throw new BadRequestError("Classroom ID is required.");

    const assignments = await prisma.assignment.findMany({
      where: { classroomId },
      include: {
        attachments: true,
        author: { select: { fullName: true } },
        _count: { select: { submissions: true } },
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
    if (!assignmentId?.trim())
      throw new BadRequestError("Assignment ID is required.");

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

    res.status(200).json({
      success: true,
      data: submissions,
      message: "Student submissions retrieved successfully.",
    });
  } catch (error) {
    next(error);
  }
};
