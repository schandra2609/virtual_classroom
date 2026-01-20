import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";
import type { ClassroomMember, User } from "../../generated/prisma/client.ts";
import { BadRequestError, ForbiddenError, UnauthorizedError } from "../errors/handler.error.ts";
import { ENV_CONFIG } from "../configs/env.config.ts";
import { prisma } from "../configs/database.config.ts";
import { dayjs } from "../configs/dayjs.config.ts";

export interface AuthenticatedRequest extends Request {
    user?: Partial<User>;
    membership?: ClassroomMember;
}

export const verifyToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const authHeader = req.headers.authorization?.trim();
        if(!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedError("Authorization header missing or malformed");
        }

        const token = authHeader.split(' ')[1];
        if(!token) {
            throw new UnauthorizedError("Token not provided");
        }

        const decoded = jwt.verify(token, ENV_CONFIG.ACCESS_TOKEN.SECRET) as JwtPayload;
        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: {
                id: true,
                email: true,
                fullName: true,
                accountType: true,
                isEmailVerified: true,
                emailVerificationExpiry: true,
            },
        });
        if(!user) {
            throw new UnauthorizedError("User not found");
        }

        if(user.accountType !== "ADMINISTRATOR" && user.isEmailVerified && user.emailVerificationExpiry && dayjs().isAfter(user.emailVerificationExpiry) ) {
            await prisma.user.update({
                where: { id: user.id },
                data: { isEmailVerified: false, emailVerificationExpiry: null },
            });
            user.isEmailVerified = false;
            user.emailVerificationExpiry = null;
        }

        req.user = user;
        next();
    } catch (error: any) {
        if(error.name === "TokenExpiredError" || error.name === "JsonWebTokenError") {
            next(new UnauthorizedError("Invalid or expired token"));
        } else {
            next(error);
        }
    }
};

export const authorize = (...allowedAccountTypes: string[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
        if(!(req.user && allowedAccountTypes.includes(req.user.accountType as string))) {
            return next(new ForbiddenError(`This action is restricted to ${allowedAccountTypes.join(" or ")} account(s) only`));
        }
        return next();
    };
};

const checkClassroomRole = (...allowedClassroomRoles: string[]) => {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { classroomId } = req.params as { classroomId: string };
            const userId = req.user?.id;

            if(!classroomId?.trim() || !userId) {
                throw new BadRequestError("Classroom ID & User ID is required");
            }

            const membership = await prisma.classroomMember.findUnique({
                where: {
                    userId_classroomId: {
                        userId: userId,
                        classroomId: classroomId,
                    },
                },
            });

            if(!membership || !allowedClassroomRoles.includes(membership.role) || membership.membershipStatus === "PENDING") {
                throw new ForbiddenError(`This action is restricted to APPROVED ${allowedClassroomRoles.join(" or ")} role(s) only`);
            }

            req.membership = membership;
            next();
        } catch (error) {
            next(error);
        }
    };
};

export const isClassroomStudent = checkClassroomRole("STUDENT");
export const isClassroomTutor = checkClassroomRole("CREATOR", "CO_TUTOR");
export const isCreator = checkClassroomRole("CREATOR");
export const isMember = checkClassroomRole("STUDENT", "CREATOR", "CO_TUTOR");