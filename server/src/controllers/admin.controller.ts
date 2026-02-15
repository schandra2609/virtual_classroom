/**
 * @file admin.controller.ts
 * @module Controllers/Administration
 * @description Provides administrative oversight for the platform.
 * Currently focuses on the Tutor Verification Pipeline, allowing administrators
 * to review, approve, or reject tutor applications based on submitted qualifications.
 * @author Sayan Chandra
 */
import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.ts";
import { BadRequestError, ConflictError, NotFoundError } from "../errors/handler.error.ts";
import { prisma } from "../configs/database.config.ts";

/**
 * @async
 * @function getTutorApplications
 * @description Retrieves a list of users with the 'TUTOR' account type, filtered by their verification status.
 * Used by the Admin Dashboard to manage the onboarding queue.
 * @param {AuthenticatedRequest} req - Express request. Expects 'status' as a query parameter.
 * @param {Response} res - Success response with the array of tutor profiles.
 * @param {NextFunction} next - Error propagation.
 * @throws {BadRequestError} 400 - If the 'status' query is missing or invalid.
 * @returns {Promise<void>}
 */
export const getTutorApplications = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { status } = req.query as { status: string };
        /** @section Validation */
        if (!status?.trim()) {
            throw new BadRequestError("A 'status' query parameter is required.");
        }

        const normalizedStatus = status.toUpperCase();
        if (!["PENDING", "VERIFIED", "REJECTED"].includes(normalizedStatus)) {
            throw new BadRequestError("Invalid status. Must be PENDING, VERIFIED or REJECTED.");
        }

        /** @section Database Query */
        const tutors = await prisma.user.findMany({
            where: {
                accountType: "TUTOR",
                tutorVerificationStatus: normalizedStatus as any,
            },
            select: {
                id: true,
                email: true,
                fullName: true,
                tutorQualificationUrl: true,
                tutorVerificationStatus: true,
                tutorStatusUpdatedAt: true,
            },
        });

        res.status(200).json({
            success: true,
            data: tutors,
            message: `${normalizedStatus} tutor applications retrieved successfully.`,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @async
 * @function approveTutor
 * @description Grants 'VERIFIED' status to a tutor application. 
 * This enables the user to create classrooms and manage academic content.
 * @param {AuthenticatedRequest} req - Request containing 'tutorId' in URL parameters.
 * @param {Response} res - Success response with updated tutor metadata.
 * @param {NextFunction} next - Error propagation.
 * @throws {NotFoundError} 404 - If the tutor ID does not exist in the database.
 * @throws {ConflictError} 409 - If the tutor is already verified (Idempotency check).
 * @returns {Promise<void>}
 */
export const approveTutor = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { tutorId } = req.params as { tutorId: string };
        if(!tutorId.trim()) {
            throw new BadRequestError("Tutor ID is required.");
        }

        /** @section Integrity Check */
        const tutor = await prisma.user.findFirst({
            where: { id: tutorId as string, accountType: "TUTOR" },
        });
        if (!tutor) throw new NotFoundError("Tutor not found.");
        if (tutor.tutorVerificationStatus === "VERIFIED") {
            throw new ConflictError("This tutor has already been verified.");
        }

        /** @section State Transition */
        const approvedTutor = await prisma.user.update({
            where: { id: tutorId as string, accountType: "TUTOR" },
            data: {
                tutorVerificationStatus: "VERIFIED",
                tutorStatusUpdatedAt: new Date(),
            },
            select: { id: true, fullName: true, email: true, tutorVerificationStatus: true },
        })

        /** 
         * @todo Implement Notification Service
         * Send an automated email to the tutor notifying them of their account activation.
         */

        res.status(200).json({
            success: true,
            data: approvedTutor,
            message: "Tutor application has been approved successfully.",
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @async
 * @function rejectTutor
 * @description Denies a tutor application and moves the status to 'REJECTED'.
 * Retains the record to enforce a "cool-down" period for re-applications.
 * @param {AuthenticatedRequest} req - Request containing 'tutorId' in URL parameters.
 * @param {Response} res - Success response.
 * @param {NextFunction} next - Error propagation.
 * @throws {NotFoundError} 404 - If the tutor ID does not exist.
 * @throws {ConflictError} 409 - If the application is already in rejected state.
 * @returns {Promise<void>}
 */
export const rejectTutor = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { tutorId } = req.params as { tutorId: string };
        const { reason } = req.body as { reason: string };
        if(!tutorId.trim()) {
            throw new BadRequestError("Tutor ID is required.");
        }
        if(!reason?.trim()) {
            throw new BadRequestError("A rejection reason is required.");
        }

        const tutor = await prisma.user.findFirst({
            where: { id: tutorId as string, accountType: "TUTOR" },
        });
        if (!tutor) throw new NotFoundError("Tutor not found");
        if(tutor.tutorVerificationStatus === "REJECTED") {
            throw new ConflictError("This tutor has already been rejected.");
        }

        const rejectedTutor = await prisma.user.update({
            where: { id: tutorId as string, accountType: "TUTOR" },
            data: {
                tutorVerificationStatus: "REJECTED",
                tutorRejectionReason: reason.trim(),
                tutorStatusUpdatedAt: new Date(),
            },
            select: { id: true, fullName: true, email: true, tutorVerificationStatus: true },
        });

        // TODO: Send email to the tutor for rejection

        res.status(200).json({
            success: true,
            data: rejectedTutor,
            message: "Tutor has been rejected",
        });
    } catch (error) {
        next(error);
    }
};