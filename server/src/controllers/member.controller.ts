import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.ts";
import { BadRequestError, ForbiddenError, NotFoundError } from "../errors/handler.error.ts";
import { prisma } from "../configs/database.config.ts";
import { dayjs } from "../configs/dayjs.config.ts";

export const getClassroomMembers = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { classroomId } = req.params as { classroomId: string };
        const { status } = req.query as { status: string };
        if(![classroomId, status].every((field) => field.trim())) {
            throw new BadRequestError("Classroom ID, status are required.");
        }

        const whereClause: Partial<{ classroomId: string, membershipStatus: string }> = { classroomId: classroomId };
        if(["APPROVED", "PENDING"].includes(status.toUpperCase())) {
            whereClause.membershipStatus = status.toUpperCase();
        }

        const members = await prisma.classroomMember.findMany({
            where: whereClause as any,
            include: { user: { select: { id: true, fullName: true, email: true } } },
            orderBy: { joinedAt: 'asc' },
        });

        res.status(200).json({
            success: true,
            data: members,
            message: "Classroom members fetched successfully",
        });
    } catch (error) {
        next(error);
    }
};

export const removeMember = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { classroomId, memberId } = req.params as { classroomId: string, memberId: string };
        const remover = req.membership;
        if(![classroomId, memberId].every((field) => field.trim())) {
            throw new BadRequestError("Classroom ID, member ID are required.");
        }
        if (remover?.userId === memberId) {
            throw new BadRequestError("You cannot remove yourself from a classroom.");
        }

        const memberToRemove = await prisma.classroomMember.findUnique({
            where: { userId_classroomId: { userId: memberId, classroomId: classroomId } },
        });
        if (!memberToRemove) {
            throw new NotFoundError("Member not found in this classroom");
        }
        if (memberToRemove.role === 'CREATOR') {
            throw new ForbiddenError("The creator of the classroom cannot be removed.");
        }
        if (memberToRemove.role === "CO_TUTOR" && remover?.role === "CO_TUTOR") {
            throw new ForbiddenError("Co-tutors can't remove co-tutors");
        }

        await prisma.classroomMember.delete({
            where: { userId_classroomId: { userId: memberId, classroomId: classroomId } },
        });
        res.status(200).json({
            success: true,
            message: "Member removed from the classroom",
        });
    } catch (error) {
        next(error);
    }
};

export const approveStudent = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const approverId = req.user?.id as string;
        const { classroomId, studentId } = req.params as { classroomId: string, studentId: string };
        if(![approverId, classroomId, studentId].every((field) => field?.trim())) {
            throw new BadRequestError("Approver ID, classroom ID, student ID are required.");
        }

        const membershipToApprove = await prisma.classroomMember.findUnique({
            where: {
                userId_classroomId: { userId: studentId, classroomId: classroomId },
                role: "STUDENT",
                membershipStatus: "PENDING",
            },
        });
        if (!membershipToApprove) {
            throw new NotFoundError("No pending join request for this student found in this classroom");
        }

        const updatedMembership = await prisma.classroomMember.update({
            where: { userId_classroomId: { userId: studentId, classroomId: classroomId } },
            data: { membershipStatus: "APPROVED", approvedById: approverId },
        });
        res.status(200).json({
            success: true,
            data: updatedMembership,
            message: "Student has been approved.",
        });
    } catch (error) {
        next(error);
    }
};

export const updateStudentPayment = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { classroomId, studentId } = req.params as { classroomId: string, studentId: string };
        if(![classroomId, studentId].every((field) => field.trim())) {
            throw new BadRequestError("Missing values: classroom id, student id");
        }

        const { durationInMonths } = req.body as { durationInMonths: number };
        if(![1, 3, 6, 12].includes(durationInMonths)) {
            throw new BadRequestError("Invalid payment duration");
        }

        const membership = await prisma.classroomMember.findUnique({
            where: { userId_classroomId: { userId: studentId, classroomId: classroomId } },
        });
        if (membership?.role !== 'STUDENT') {
            throw new NotFoundError("No student membership found in the classroom");
        }

        const now = dayjs();
        const currentExpiry = dayjs(membership.feePaidUntil);
        const startDate = currentExpiry.isAfter(now) ? currentExpiry : now;
        const newExpiryDate = startDate.add(durationInMonths, 'month').toDate();
        const updatedmembership = await prisma.classroomMember.update({
            where: { userId_classroomId: { userId: studentId, classroomId: classroomId } },
            data: { feePaidUntil: newExpiryDate },
        });
        res.status(200).json({
            success: true,
            data: updatedmembership,
            message: `Student's payment verified. Access granted until ${dayjs(newExpiryDate).format('DD MMM, YYYY')}.`
        });
    } catch (error) {
        next(error);
    }
};