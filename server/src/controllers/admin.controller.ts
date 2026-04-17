/**
 * @file admin.controller.ts
 * @module Controllers/Administration
 * @description Provides administrative oversight for the platform.
 * Integrates with the decoupled TutorApplication ledger schema.
 * @author Sayan Chandra
 */
import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.ts";
import { BadRequestError, NotFoundError } from "../utils/Error.ts";
import { prisma } from "../configs/database.config.ts";
import { getPresignedUrl } from "../services/storage.service.ts";

/**
 * @async
 * @function getTutorApplications
 * @description Retrieves a list of tutor applications filtered by status.
 * Dynamically generates secure, short-lived presigned URLs for qualification documents.
 */
export const getTutorApplications = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const { status } = req.query as { status: string };
        if (!status?.trim()) throw new BadRequestError("A 'status' query parameter is required.");

        const normalizedStatus = status.toUpperCase();
        if (!["PENDING", "VERIFIED", "REJECTED"].includes(normalizedStatus)) {
            throw new BadRequestError("Invalid status. Must be PENDING, VERIFIED or REJECTED.");
        }

        // Query the ledger and JOIN the user profile data
        const applications = await prisma.tutorApplication.findMany({
            where: { status: normalizedStatus as any },
            include: {
                user: { select: { id: true, email: true, fullName: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        // 🚨 NEW: Asynchronously map the results to generate secure MinIO URLs
        const formattedData = await Promise.all(
            applications.map(async (app) => {
                let securePdfUrl = app.documentUrl;
                
                // If the URL exists and is a relative path in MinIO, convert it to a presigned URL
                if (securePdfUrl && !securePdfUrl.startsWith("http")) {
                    securePdfUrl = await getPresignedUrl(securePdfUrl);
                }

                return {
                    id: app.user.id,
                    applicationId: app.id,
                    email: app.user.email,
                    fullName: app.user.fullName,
                    tutorQualificationUrl: securePdfUrl,
                    tutorVerificationStatus: app.status,
                    tutorStatusUpdatedAt: app.updatedAt,
                    tutorRejectionReason: app.rejectionReason,
                    createdAt: app.createdAt
                };
            })
        );

        res.status(200).json({
            success: true,
            data: formattedData,
            message: `${normalizedStatus} tutor applications retrieved.`,
        });
    } catch (error) {
        next(error);
    }
};

export const approveTutor = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const { tutorId } = req.params as { tutorId: string };
        if (!tutorId.trim()) throw new BadRequestError("Tutor ID is required.");

        const application = await prisma.tutorApplication.findFirst({
            where: { userId: tutorId, status: "PENDING" }
        });
        if (!application) throw new NotFoundError("No pending application found for this tutor.");

        await prisma.tutorApplication.update({
            where: { id: application.id },
            data: { status: "VERIFIED" }
        });

        // TODO: Notification Service

        res.status(200).json({
            success: true,
            message: "Tutor application has been approved.",
        });
    } catch (error) {
        next(error);
    }
};

export const rejectTutor = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const { tutorId } = req.params as { tutorId: string };
        const { reason } = req.body as { reason: string };
        if (!tutorId.trim()) throw new BadRequestError("Tutor ID is required.");
        if (!reason?.trim()) throw new BadRequestError("A rejection reason is required.");

        const application = await prisma.tutorApplication.findFirst({ where: { userId: tutorId, status: "PENDING" } });
        if (!application) throw new NotFoundError("No pending application found for this tutor.");

        await prisma.tutorApplication.update({
            where: { id: application.id },
            data: {
                status: "REJECTED",
                rejectionReason: reason.trim()
            }
        });

        // TODO: Send email

        res.status(200).json({
            success: true,
            message: "Tutor application has been rejected.",
        });
    } catch (error) {
        next(error);
    }
};