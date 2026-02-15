/**
 * @file classroom.controller.ts
 * @module Controllers/Classroom
 * @description Logic for classroom management, including lifecycle events (create/delete),
 * enrollment (join/leave), and administrative staff management (invites/ownership transfer).
 * @author Sayan Chandra
 */
import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.ts";
import { prisma } from "../configs/database.config.ts";
import { dayjs } from "../configs/dayjs.config.ts";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "../errors/handler.error.ts";
import Helper from "../utils/Helper.ts";
import type { User } from "../../generated/prisma/client.ts";
import { sendClassroomInvite } from "../services/email.service.ts";
import { ENV_CONFIG } from "../configs/env.config.ts";

/**
 * @async
 * @function getMyClassrooms
 * @description Retrieves a list of all classrooms where the authenticated user is a member.
 * @param {AuthenticatedRequest} req - Express request with user context.
 * @param {Response} res - Returns an array of Classroom objects.
 * @param {NextFunction} next - Error propagation.
 * @returns {Promise<void>}
 */
export const getMyClassrooms = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id as string;

    const memberships = await prisma.classroomMember.findMany({
      where: { userId: userId },
      include: { classroom: true },
    });

    // Flatten the response to return only the classroom details
    const classrooms = memberships.map((m) => m.classroom);

    res.status(200).json({
      success: true,
      data: classrooms,
      message: "Classrooms retrieved successfully.",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @async
 * @function createClassroom
 * @description Initializes a new classroom and assigns the creator as the primary TUTOR/CREATOR.
 * Logic:
 * 1. Validates that the user is a 'VERIFIED' tutor.
 * 2. Generates a unique 8-character joining code with a collision-check loop.
 * 3. Uses a **Database Transaction** to ensure both the Classroom and the initial
 *    Membership are created atomically.
 * @param {AuthenticatedRequest} req - Body: { name, subject, batch }.
 * @throws {ForbiddenError} 403 - If the tutor is not verified.
 * @returns {Promise<void>}
 */
export const createClassroom = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, subject, batch } = req.body as {
      name: string;
      subject: string;
      batch: string;
    };
    if (![name, subject, batch].every((field) => field.trim())) {
      throw new BadRequestError(
        "Name, subject, batch are required to initialize a classroom.",
      );
    }

    const creator = req.user as User;
    if (creator.tutorVerificationStatus !== "VERIFIED") {
      throw new ForbiddenError(
        "This action is restricted to VERIFIED TUTORs only.",
      );
    }

    // Generate a unique joining code
    let joiningCode: string;
    let isUnique = false;
    while (!isUnique) {
      joiningCode = Helper.generateRandomCode(8);
      const existingClassroom = await prisma.classroom.findUnique({
        where: { joiningCode: joiningCode },
      });
      if (!existingClassroom) isUnique = true;
    }

    const newClassroom = await prisma.$transaction(async (txn) => {
      const classroom = await txn.classroom.create({
        data: {
          name: name,
          batch: batch,
          subject: subject,
          joiningCode: joiningCode,
        },
      });
      await txn.classroomMember.create({
        data: {
          classroomId: classroom.id as string,
          userId: creator.id as string,
          role: "CREATOR",
          membershipStatus: "APPROVED",
        },
      });
      return classroom;
    });
    res.status(201).json({
      success: true,
      data: newClassroom,
      message: "New classroom created successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @async
 * @function joinClassroom
 * @description Allows a student to request enrollment in a classroom using a specific code.
 * Requests remain in 'PENDING' status until approved by a tutor.
 * @param {AuthenticatedRequest} req - Body: { joiningCode }.
 * @throws {NotFoundError} 404 - If the joining code is invalid.
 * @throws {ConflictError} 409 - If the student is already a member.
 * @returns {Promise<void>}
 */
export const joinClassroom = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const studentId = req.user?.id as string;
    const { joiningCode } = req.body as { joiningCode: string };
    if (!joiningCode.trim()) {
      throw new BadRequestError("Joining code is required.");
    }

    const classroomToJoin = await prisma.classroom.findUnique({
      where: { joiningCode: joiningCode },
    });
    if (!classroomToJoin) {
      throw new NotFoundError("Classroom not found.");
    }

    const existingMember = await prisma.classroomMember.findFirst({
      where: { userId: studentId, classroomId: classroomToJoin.id },
    });
    if (existingMember) {
      throw new ConflictError("Existing member to the classroom.");
    }

    const newMembership = await prisma.classroomMember.create({
      data: {
        userId: studentId,
        classroomId: classroomToJoin.id as string,
        role: "STUDENT",
        membershipStatus: "PENDING",
      },
    });

    res.status(201).json({
      success: true,
      data: newMembership,
      message: "Request to join the classroom is awating tutor approval.",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @async
 * @function getClassroomById
 * @description Fetches comprehensive details for a specific classroom.
 * **Data Privacy Implementation:**
 * - If the requester is a STUDENT, the member list is filtered to show only
 *   teaching staff and the student's own record to prevent mass data scraping.
 * - If the requester is a TUTOR/CREATOR, the full roster is returned.
 * @returns {Promise<void>}
 */
export const getClassroomById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { classroomId } = req.params as { classroomId: string };
    const userId = req.user?.id as string;
    const userRole = req.membership?.role as string;
    if (![classroomId, userId, userRole].every((field) => field.trim())) {
      throw new BadRequestError(
        "Classroom ID, user ID, user role are required.",
      );
    }
    const classroom = await prisma.classroom.findUnique({
      where: { id: classroomId.trim() as string },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                accountType: true,
                profilePhotoUrl: true,
              },
            },
          },
        },
      },
    });
    if (!classroom) {
      throw new NotFoundError("Classroom not found.");
    }

    // Enforce Privacy: Students see staff + self. Tutors see everyone.
    if (userRole === "STUDENT") {
      classroom.members = classroom.members.filter(
        (member) =>
          ["CREATOR", "CO_TUTOR"].includes(member.role) ||
          member.userId === userId,
      );
    }

    res.status(200).json({
      success: true,
      data: classroom,
      message: "Classroom details retrieved successfully.",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @async
 * @function updateClassroom
 * @description Updates metadata (name, subject, batch) for an existing classroom.
 * @returns {Promise<void>}
 */
export const updateClassroom = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { classroomId } = req.params as { classroomId: string };
    if (!classroomId.trim()) {
      throw new BadRequestError("Classroom ID is required.");
    }
    const { name, subject, batch } = req.body as Partial<{
      name: string;
      subject: string;
      batch: string;
    }>;
    if (![name, subject, batch].some((field) => field?.trim())) {
      throw new BadRequestError("Nothing to update.");
    }

    const updateData: Partial<{
      name: string;
      subject: string;
      batch: string;
    }> = {};
    if (name?.trim()) updateData.name = name?.trim();
    if (subject?.trim()) updateData.subject = subject?.trim();
    if (batch?.trim()) updateData.batch = batch?.trim();

    const updatedClassroom = await prisma.classroom.update({
      where: { id: classroomId as string },
      data: updateData,
    });

    res.status(200).json({
      success: true,
      data: updatedClassroom,
      message: "Classroom updated successfully.",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @async
 * @function deleteClassroom
 * @description Permanently removes a classroom and all associated content.
 * Cascades to members, announcements, and assignments via DB policy.
 * @returns {Promise<void>}
 */
export const deleteClassroom = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { classroomId } = req.params as { classroomId: string };
    if (!classroomId.trim()) {
      throw new BadRequestError("Classroom ID is required.");
    }

    await prisma.classroom.delete({ where: { id: classroomId as string } });
    res.status(200).json({
      success: true,
      message: "Classroom deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @async
 * @function leaveClassroom
 * @description Removes the authenticated user from the classroom roster.
 * @throws {ForbiddenError} 403 - If the user is the CREATOR (Owners must transfer ownership first).
 * @returns {Promise<void>}
 */
export const leaveClassroom = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { classroomId } = req.params as { classroomId: string };
    const userId = req.user?.id as string;
    if (!classroomId.trim()) {
      throw new BadRequestError("Classroom ID is required.");
    }
    if (req.membership?.role === "CREATOR") {
      throw new ForbiddenError("The classroom creator cannot leave.");
    }

    await prisma.classroomMember.delete({
      where: {
        userId_classroomId: { userId: userId, classroomId: classroomId },
      },
    });
    res.status(200).json({
      success: true,
      message: "You have successfully left the classroom",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @async
 * @function inviteCoTutor
 * @description Issues an invitation to another tutor. Valid for 7 days (168 hours).
 * @returns {Promise<void>}
 */
export const inviteCoTutor = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { classroomId } = req.params as { classroomId: string };
    const { inviteeEmail, inviteeName } = req.body as {
      inviteeEmail: string;
      inviteeName: string;
    };
    const inviter = req.user as User;
    if (inviter?.tutorVerificationStatus !== "VERIFIED") {
      throw new ForbiddenError("Not a verified tutor account");
    }
    if (
      ![inviteeEmail, inviteeName, classroomId].every((field) => field.trim())
    ) {
      throw new BadRequestError(
        "Classroom ID, invitee name, invitee email are required",
      );
    }

    const expiresAt = dayjs().add(168, "hour").toDate();
    const classroom = await prisma.classroom.findUnique({
      where: { id: classroomId },
    });
    if (!classroom) {
      throw new NotFoundError("Classroom not found.");
    }

    const invitation = await prisma.classroomInvitation.create({
      data: {
        expiresAt: expiresAt,
        classroomId: classroomId,
        inviterId: inviter.id,
        inviteeEmail: inviteeEmail.toLowerCase(),
      },
    });

    // Send Invitation Email
    const inviteUrl = `${ENV_CONFIG.CORS_ORIGIN[0]}/dashboard/tutor/invitations?id=${invitation.id}`;
    await sendClassroomInvite(
      { name: inviteeName, email: inviteeEmail },
      inviteUrl,
      classroom.name,
      "Co-Tutor",
    );

    res.status(201).json({
      success: true,
      message: `Invitation sent to ${inviteeEmail}`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @async
 * @function refreshJoiningCode
 * @description Regenerates a new unique joining code for the classroom.
 * Renders the previous code obsolete.
 * @returns {Promise<void>}
 */
export const refreshJoiningCode = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { classroomId } = req.params as { classroomId: string };
    if (!classroomId?.trim()) {
      throw new BadRequestError("Classroom ID id required.");
    }

    let newJoiningCode;
    let isUnique = false;
    while (!isUnique) {
        newJoiningCode = Helper.generateRandomCode(8);
        const existingClassroom = await prisma.classroom.findUnique({
            where: { joiningCode: newJoiningCode },
        });
        if (!existingClassroom) isUnique = true;
    }

    const updatedClassroom = await prisma.classroom.update({
      where: { id: classroomId },
      data: { joiningCode: newJoiningCode as string },
    });

    res.status(200).json({
      success: true,
      data: { newJoiningCode: updatedClassroom.joiningCode },
      message: "Classroom joining code has been refreshed",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @async
 * @function transferOwnership
 * @description Transfers the 'CREATOR' role to a 'CO_TUTOR'.
 * The original creator is downgraded to a 'CO_TUTOR' role within the same transaction.
 * @param {AuthenticatedRequest} req - Body: { newOwnerId }.
 * @returns {Promise<void>}
 */
export const transferOwnership = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.id as string;
    const { newOwnerId } = req.body as { newOwnerId: string };
    const { classroomId } = req.params as { classroomId: string };
    if (![userId, newOwnerId, classroomId].every((field) => field.trim())) {
      throw new BadRequestError(
        "User ID, new owner ID, classroom ID are required.",
      );
    }

    const newOwnership = await prisma.classroomMember.findUnique({
      where: {
        userId_classroomId: { userId: newOwnerId, classroomId: classroomId },
      },
    });
    if (!newOwnership || newOwnership?.role !== "CO_TUTOR") {
      throw new BadRequestError("The selected member is not a co-tutor.");
    }

    await prisma.$transaction(async (txn) => {
      await txn.classroomMember.update({
        where: {
          userId_classroomId: { userId: userId, classroomId: classroomId },
        },
        data: { role: "CO_TUTOR" },
      });
      await txn.classroomMember.update({
        where: {
          userId_classroomId: { userId: newOwnerId, classroomId: classroomId },
        },
        data: { role: "CREATOR" },
      });
    });
    res.status(200).json({
      success: true,
      message: "Classroom ownership transfered successfully.",
    });
  } catch (error) {
    next(error);
  }
};