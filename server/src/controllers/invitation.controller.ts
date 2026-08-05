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
import {
    BadRequestError,
    ConflictError,
    ForbiddenError,
    NotFoundError,
} from "../utils/Error.ts";

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
export const getMyInvitations = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const userEmail = req.user?.email as string;
        const invitations = await prisma.classroomInvitation.findMany({
            where: {
                inviteeEmail: userEmail.toLowerCase(),
                status: "PENDING",
                expiresAt: { gt: new Date() }, // Only fetch non-expired invites
            },
            include: {
                classroom: {
                    select: { name: true, subject: true, batch: true },
                },
                inviter: { select: { fullName: true } },
            },
            orderBy: { createdAt: "desc" },
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
 * 1. Validates that the user is a 'VERIFIED' tutor by querying the TutorApplication ledger (single source of truth).
 * 2. Checks invitation existence, status, and expiry.
 * 3. Verifies that the inviteeEmail matches the authenticated user's email.
 * 4. Executes a **Database Transaction** to:
 * - Create a 'CO_TUTOR' membership record.
 * - Update the invitation status to 'ACCEPTED'.
 * @param {AuthenticatedRequest} req - Request containing invitationId in URL params.
 * @param {Response} res - Success response confirming membership.
 * @param {NextFunction} next - Error propagation.
 * @throws {ForbiddenError} 403 - If the user is not verified or the email does not match.
 * @throws {NotFoundError} 404 - If the invitation is missing or already processed.
 * @throws {BadRequestError} 400 - If the invitation has expired.
 * @throws {ConflictError} 409 - If the user is already a member of the classroom.
 * @returns {Promise<void>}
 */
export const acceptCoTutorInvitation = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const { invitationId } = req.params as { invitationId: string };
        const user = req.user;

        if (!invitationId?.trim()) {
            throw new BadRequestError("Invitation ID is required.");
        }

        // 🚨 STRICT SECURITY CHECK: Database-level verification
        // Check 1: Ensure the user's account type is actually TUTOR
        const dbUser = await prisma.user.findUnique({
            where: { id: user?.id as string },
            select: { accountType: true } // Removed the invalid tutorVerificationStatus field
        });

        // Check 2: Query the TutorApplication ledger as the single source of truth for verification
        const latestApplication = await prisma.tutorApplication.findFirst({
            where: { userId: user?.id as string },
            orderBy: { createdAt: "desc" }
        });

        // The user is only verified if their account type is TUTOR AND their latest application is VERIFIED
        const isVerifiedTutor = dbUser?.accountType === "TUTOR" && latestApplication?.status === "VERIFIED";

        if (!isVerifiedTutor) {
            throw new ForbiddenError("Access denied: You must be a fully verified tutor to accept invitations.");
        }

        // Fetch the pending invitation
        const invitation = await prisma.classroomInvitation.findUnique({
            where: { id: invitationId, status: "PENDING" },
        });

        if (!invitation) {
            throw new NotFoundError("Invitation not found or has already been processed.");
        }
        
        // Expiry check
        if (new Date() > invitation.expiresAt) {
            // Automatically clean up the expired invitation in the background
            await prisma.classroomInvitation.update({
                where: { id: invitationId },
                data: { status: "EXPIRED" }
            });
            throw new BadRequestError("This invitation has expired.");
        }
        
        // Integrity Check: Is the person logged in the one who was actually invited?
        if (invitation.inviteeEmail.toLowerCase() !== user?.email?.toLowerCase()) {
            throw new ForbiddenError("This invitation is intended for a different user address.");
        }

        /**
         * @section Atomic Transaction
         * Ensures that the membership is granted and the invite is marked as used simultaneously.
         * If either fails, the database rolls back to prevent ghost records.
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
            message: "Invitation accepted successfully. You are now a Co-Tutor.",
        });
        
    } catch (error: any) {
        /**
         * @section Conflict Handling
         * P2002 handles the case where the user is somehow already a member.
         * We mark the invitation as accepted to clean it out of the pending queue.
         */
        if (error.code === "P2002") {
            await prisma.classroomInvitation.update({
                where: { id: req.params?.invitationId as string },
                data: { status: "ACCEPTED" },
            });
            
            // Pass the conflict error to the Express error handler
            next(new ConflictError("You are already a member of this classroom."));
            return;
        }
        next(error);
    }
};