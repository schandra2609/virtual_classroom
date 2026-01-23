import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.ts";
import { prisma } from "../configs/database.config.ts";
import { dayjs } from "../configs/dayjs.config.ts";
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from "../errors/handler.error.ts";
import Helper from "../utils/Helper.ts";
import type { User } from "../../generated/prisma/client.ts";

export const getMyClassrooms = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id as string;
        const memberships = await prisma.classroomMember.findMany({
            where: { userId: userId },
            include: { classroom: true },
        });
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

export const createClassroom = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { name, subject, batch } = req.body as { name: string, subject: string, batch: string };
        if(![name, subject, batch].every((field) => field.trim())) {
            throw new BadRequestError("Name, subject, batch are required to initialize a classroom.");
        }
        const creator = req.user as User;
        if(creator.tutorVerificationStatus !== "VERIFIED") {
            throw new ForbiddenError("This action is restricted to VERIFIED TUTORs only.")
        }

        let joiningCode: string;
        let isUnique = false;
        while(isUnique) {
            joiningCode = Helper.generateRandomCode(8);
            const existingClassroom = await prisma.classroom.findUnique({ where: { joiningCode: joiningCode } });
            if(!existingClassroom) isUnique = true;
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

export const joinClassroom = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const studentId = req.user?.id as string;
        const { joiningCode } = req.body as { joiningCode: string };
        if(![studentId, joiningCode].every((field) => field.trim())) {
            throw new BadRequestError("Student ID, joining code are required to join a classroom.");
        }

        const classroomToJoin = await prisma.classroom.findUnique({ where: { joiningCode: joiningCode } });
        if(!classroomToJoin) {
            throw new NotFoundError("Classroom not found.");
        }

        const existingMember = await prisma.classroomMember.findFirst({ where: { userId: studentId, classroomId: classroomToJoin.id }});
        if(existingMember) {
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

export const getClassroomById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { classroomId } = req.params as { classroomId: string };
        const userId = req.user?.id as string;
        const userRole = req.membership?.role as string;
        if(![classroomId, userId, userRole].every((field) => field.trim())) {
            throw new BadRequestError("Classroom ID, user ID, user role are required.");
        }
        const classroom = await prisma.classroom.findUnique({
            where: { id: classroomId.trim() as string },
            include: {
                members: {
                    include: {
                        user: {
                            select: { id: true, fullName: true, accountType: true, profilePhotoUrl: true },
                        },
                    },
                },
            },
        });
        if(!classroom) {
            throw new NotFoundError("Classroom not found.");
        }

        if(userRole === "STUDENT") {
            classroom.members = classroom.members.filter(member => 
                ["CREATOR", "CO_TUTOR"].includes(member.role) || member.userId === userId
            );
        }
        res.status(200).json({
            success: true,
            data: classroom,
            message: "Classroom details retrieved successfully."
        });
    } catch (error) {
        next(error);
    }
};

export const updateClassroom = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { classroomId } = req.params as { classroomId: string };
        if(!classroomId.trim()) {
            throw new BadRequestError("Classroom ID is required.");
        }
        const { name, subject, batch } = req.body as Partial<{ name: string, subject: string, batch: string }>;
        if(![name, subject, batch].some((field) => field?.trim())) {
            throw new BadRequestError("Nothing to update.");
        }

        const updateData: Partial<{ name: string, subject: string, batch: string }> = {};
        if(name?.trim()) updateData.name = name?.trim();
        if(subject?.trim()) updateData.subject = subject?.trim();
        if(batch?.trim()) updateData.batch = batch?.trim();

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

export const deleteClassroom = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { classroomId } = req.params as { classroomId: string };
        if(!classroomId.trim()) {
            throw new BadRequestError("Classroom ID is required.");
        }

        await prisma.classroom.delete({ where: { id: classroomId as string } });
        res.status(200).json({
            success: true,
            message: "Classroom deleted successfully",
        });
    } catch (error) { next(error); }
};

export const leaveClassroom = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { classroomId } = req.params as { classroomId: string };
        const userId = req.user?.id as string;
        if(!classroomId.trim()) {
            throw new BadRequestError("Classroom ID is required.");
        }
        if(req.membership?.role === "CREATOR") {
            throw new ForbiddenError("The classroom creator cannot leave.");
        }

        await prisma.classroomMember.delete({ where: { userId_classroomId: { userId: userId, classroomId: classroomId } } });
        res.status(200).json({
            success: true,
            message: "You have successfully left the classroom",
        });
    } catch (error) {
        next(error);
    }
};

export const inviteCoTutor = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { classroomId } = req.params as { classroomId: string };
        const { inviteeEmail, inviteeName } = req.body as { inviteeEmail: string, inviteeName: string };
        const inviter = req.user as User;
        if(inviter?.tutorVerificationStatus !== "VERIFIED") {
            throw new ForbiddenError("Not a verified tutor account");
        }
        if(![inviteeEmail, inviteeName, classroomId].every((field) => field.trim())) {
            throw new BadRequestError("Classroom ID, invitee name, invitee email are required");
        }

        const expiresAt = dayjs().add(168, 'hour').toDate();
        const classroom = await prisma.classroom.findUnique({ where: { id: classroomId } });
        if(!classroom) {
            throw new NotFoundError("Classroom not found.");
        }

        await prisma.classroomInvitation.create({
            data: {
                expiresAt: expiresAt,
                classroomId: classroomId,
                inviterId: inviter.id,
                inviteeEmail: inviteeEmail.toLowerCase(),
            },
        });

        // TODO: Send invitation email to the Co-Tutor
        
        res.status(201).json({
            success: true,
            message: `Invitation sent to ${inviteeEmail}`,
        })
    } catch (error) {
        next(error);
    }
};

export const refreshJoiningCode = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { classroomId } = req.params as { classroomId: string };
        if(!classroomId?.trim()) {
            throw new BadRequestError("Classroom ID id required.");
        }

        let newJoiningCode, isUnique = false;
        while(!isUnique) {
            newJoiningCode = Helper.generateRandomCode(8);
            const existingClassroom = await prisma.classroom.findUnique({
                where: { joiningCode: newJoiningCode }
            });
            if(!existingClassroom) isUnique = true;
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

export const transferOwnership = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id as string;
        const { newOwnerId } = req.body as { newOwnerId: string };
        const { classroomId } = req.params as { classroomId: string };
        if(![userId, newOwnerId, classroomId].every((field) => field.trim())) {
            throw new BadRequestError("User ID, new owner ID, classroom ID are required.");
        }

        const newOwnership = await prisma.classroomMember.findUnique({
            where: { userId_classroomId: { userId: newOwnerId, classroomId: classroomId } },
        });
        if(!newOwnership || newOwnership?.role !== "CO_TUTOR") {
            throw new BadRequestError("The selected member is not a co-tutor.");
        }

        await prisma.$transaction(async (txn) => {
            await txn.classroomMember.update({
                where: { userId_classroomId: { userId: userId, classroomId: classroomId } },
                data: { role: "CO_TUTOR" },
            });
            await txn.classroomMember.update({
                where: { userId_classroomId: { userId: newOwnerId, classroomId: classroomId } },
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