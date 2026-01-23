import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.ts";
import { BadRequestError, ConflictError, NotFoundError } from "../errors/handler.error.ts";
import { prisma } from "../configs/database.config.ts";

export const getTutorApplications = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { status } = req.query as { status: string };
        if (!status.trim()) {
            throw new BadRequestError("A 'status' query parameter is required.");
        }

        const normalizedStatus = status.toUpperCase();
        if (!["PENDING", "VERIFIED", "REJECTED"].includes(normalizedStatus)) {
            throw new BadRequestError("Invalid status. Must be PENDING, VERIFIED or REJECTED.");
        }

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

export const approveTutor = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { tutorId } = req.params as { tutorId: string };
        if(!tutorId.trim()) {
            throw new BadRequestError("Tutor ID is required.");
        }

        const tutor = await prisma.user.findFirst({
            where: { id: tutorId as string, accountType: "TUTOR" },
        });
        if (!tutor) throw new NotFoundError("Tutor not found.");
        if (tutor.tutorVerificationStatus === "VERIFIED") {
            throw new ConflictError("This tutor has already been verified.");
        }

        const approvedTutor = await prisma.user.update({
            where: { id: tutorId as string, accountType: "TUTOR" },
            data: {
                tutorVerificationStatus: "VERIFIED",
                tutorStatusUpdatedAt: new Date(),
            },
            select: { id: true, fullName: true, email: true, tutorVerificationStatus: true },
        })

        // TODO: Send email notifying the approval

        res.status(200).json({
            success: true,
            data: approvedTutor,
            message: "Tutor application has been approved successfully.",
        });
    } catch (error) {
        next(error);
    }
};

export const rejectTutor = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { tutorId } = req.params as { tutorId: string };
        if(!tutorId.trim()) {
            throw new BadRequestError("Tutor ID is required.");
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
                tutorStatusUpdatedAt: new Date(),
            },
            select: { id: true, fullName: true, email: true, tutorVerificationStatus: true },
        });

        res.status(200).json({
            success: true,
            data: rejectedTutor,
            message: "Tutor has been rejected",
        });
    } catch (error) {
        next(error);
    }
};