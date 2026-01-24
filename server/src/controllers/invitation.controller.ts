import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.ts";
import { prisma } from "../configs/database.config.ts";
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from "../errors/handler.error.ts";

export const getMyInvitations = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const userEmail = req.user?.email as string;
        const invitations = await prisma.classroomInvitation.findMany({
            where: {
                inviteeEmail: userEmail.toLowerCase(),
                status: "PENDING",
                expiresAt: { gt: new Date() },
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

export const acceptCoTutorInvitation = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { invitationId } = req.params as { invitationId: string };
        const user = req.user;
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
        if (invitation.inviteeEmail.toLowerCase() !== user?.email?.toLowerCase()) {
            throw new ForbiddenError("This invitation is intended for another user");
        }

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