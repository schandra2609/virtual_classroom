/**
 * @file invitation.controller.ts
 * @module Controllers/Classroom/Invitations
 * @description Handles the acceptance and retrieval of co-tutor invitations.
 * Ensures that only verified tutors can join classrooms as staff and validates
 * that invitations are used only by their intended recipients.
 * @author Sayan Chandra
 */
import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.ts";
import { prisma } from "../configs/database.config.ts";
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from "../errors/handler.error.ts";

/**
 * @async
 * @function getMyInvitations
 * @description Retrieves all pending and active (non-expired) classroom invitations 
 * sent to the currently authenticated user's email address.
 * @param {AuthenticatedRequest} req - Request object containing the user's email.
 * @param {Response} res - Success response with an array of invitations.
 * @param {NextFunction} next - Error propagation.
 * @returns {Promise<void>}
 */
export const getMyInvitations = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userEmail = req.user?.email as string;
        const invitations = await prisma.classroomInvitation.findMany({
            where: {
                inviteeEmail: userEmail.toLowerCase(),
                status: "PENDING",
                expiresAt: { gt: new Date() },  // Only fetch non-expired invites
            },
            include: {
                classroom: { select: { name: true, subject: true, batch: true } },
                inviter: { select: { fullName: true } }
            },
            orderBy: { createdAt: 'desc' },
        });
        res.status(200).json({
            success: true,
            data: invitations,
            message: "Pending invitations retrieved successfully",
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @async
 * @function acceptCoTutorInvitation
 * @description Processes the acceptance of an invitation.
 * Logic:
 * 1. Validates that the user is a 'VERIFIED' tutor.
 * 2. Checks invitation existence, status, and expiry.
 * 3. Verifies that the inviteeEmail matches the authenticated user's email.
 * 4. Executes a **Database Transaction** to:
 *    - Create a 'CO_TUTOR' membership record.
 *    - Update the invitation status to 'ACCEPTED'.
 * @param {AuthenticatedRequest} req - Request containing invitationId in URL params.
 * @param {Response} res - Success response confirming membership.
 * @param {NextFunction} next - Error propagation.
 * @throws {ForbiddenError} 403 - If the user is not verified or the email does not match.
 * @throws {NotFoundError} 404 - If the invitation is missing or expired.
 * @throws {ConflictError} 409 - If the user is already a member of the classroom.
 * @returns {Promise<void>}
 */
export const acceptCoTutorInvitation = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { invitationId } = req.params as { invitationId: string };
        const user = req.user;

        // Security Check: Only verified tutors can accept co-tutor roles
        if(user?.tutorVerificationStatus !== "VERIFIED") {
            throw new ForbiddenError("Not a verified tutor account");
        }
        if(!invitationId?.trim()) {
            throw new BadRequestError("Invitation ID is required.");
        }

        const invitation = await prisma.classroomInvitation.findUnique({
            where: { id: invitationId, status: "PENDING" },
        });
        if (!invitation || new Date() > invitation.expiresAt)
            throw new NotFoundError("Invitation not found or has expired");
        // Integrity Check: Is the person logged in the one who was actually invited?
        if (invitation.inviteeEmail.toLowerCase() !== user?.email?.toLowerCase())
            throw new ForbiddenError("This invitation is intended for another user");

        /**
         * @section Atomic Transaction
         * Ensures that the membership is granted and the invite is marked as used simultaneously.
         */
        await prisma.$transaction(async (txn) => {
            await txn.classroomMember.create({
                data: {
                    userId: user?.id as string,
                    classroomId: invitation.classroomId as string,
                    role: "CO_TUTOR",
                    membershipStatus: "APPROVED",
                },
            });
            await txn.classroomInvitation.update({
                where: { id: invitationId },
                data: { status: "ACCEPTED" },
            });
        });
        res.status(201).json({
            success: true,
            message: "Invitation, for the role CO_TUTOR, is accepted",
        });
    } catch (error: any) {
        /**
         * @section Conflict Handling
         * P2002 handles the case where the user is already a member.
         * We mark the invitation as accepted to clean up the queue.
         */
        if (error.code === 'P2002') {
            await prisma.classroomInvitation.update({
                where: { id: req.params?.invitationId as string },
                data: { status: "ACCEPTED" },
            });
            throw new ConflictError("You are already a member of this classroom.");
        }
        next(error);
    }
};