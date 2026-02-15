/**
 * @file auth.middleware.ts
 * @module Middlewares/Authentication
 * @description Provides robust security layers for route protection.
 * Includes JWT verification, Role-Based Access Control (RBAC), and
 * Classroom-specific permission checks.
 */
import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";
import type { ClassroomMember, User } from "../../generated/prisma/client.ts";
import {
  BadRequestError,
  ForbiddenError,
  UnauthorizedError,
} from "../errors/handler.error.ts";
import { ENV_CONFIG } from "../configs/env.config.ts";
import { prisma } from "../configs/database.config.ts";
import { dayjs } from "../configs/dayjs.config.ts";

/**
 * @interface AuthenticatedRequest
 * @extends Request
 * @description Custom extension of the Express Request object to include
 * properties populated by authentication and authorization middlewares.
 * @property {Partial<User>} [user] - The authenticated user's database record.
 * @property {ClassroomMember} [membership] - The membership details if the request is classroom-scoped.
 */
export interface AuthenticatedRequest extends Request {
  user?: Partial<User>;
  membership?: ClassroomMember;
}

/**
 * @async
 * @function verifyToken
 * @description Primary authentication middleware.
 * 1. Validates the 'Authorization: Bearer <token>' header.
 * 2. Decodes the JWT and retrieves the user from the database.
 * 3. Checks for email verification expiry and revokes status if necessary.
 * 4. Attaches a 'user' object with the request, assuring the object is not null/undefined.
 * @param {AuthenticatedRequest} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next middleware function.
 * @throws {UnauthorizedError} If token is missing, invalid, expired, or user doesn't exist.
 * @returns {Promise<void>}
 */
export const verifyToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization?.trim();
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedError("Authorization header missing or malformed");
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      throw new UnauthorizedError("Token not provided");
    }

    const decoded = jwt.verify(
      token,
      ENV_CONFIG.ACCESS_TOKEN.SECRET,
    ) as JwtPayload;
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        accountType: true,
        isEmailVerified: true,
        emailVerificationExpiry: true,
        tutorVerificationStatus: true,
      },
    });
    if (!user) {
      throw new UnauthorizedError("User not found");
    }

    /**
     * Business Logic: Verification Lifecycle
     * Revokes 'isEmailVerified' status if the verification period has expired.
     */
    if (
      user.accountType !== "ADMINISTRATOR" &&
      user.isEmailVerified &&
      user.emailVerificationExpiry &&
      dayjs().isAfter(user.emailVerificationExpiry)
    ) {
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
    if (
      error.name === "TokenExpiredError" ||
      error.name === "JsonWebTokenError"
    ) {
      next(new UnauthorizedError("Invalid or expired token"));
    } else {
      next(error);
    }
  }
};

/**
 * @function authorize
 * @description General RBAC middleware to restrict access by account type.
 * @param {...string[]} allowedAccountTypes - List of AccountType enums (e.g., 'ADMINISTRATOR', 'TUTOR').
 * @returns {function} An Express middleware function.
 * @example
 * router.get("/any-admin-only-route", authorize("ADMINISTRATOR"), controller);
 */
export const authorize = (...allowedAccountTypes: string[]) => {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): void => {
    if (!allowedAccountTypes.includes(req.user?.accountType as string)) {
      return next(
        new ForbiddenError(
          `This action is restricted to ${allowedAccountTypes.join(" or ")} account(s) only`,
        ),
      );
    }
    return next();
  };
};

/**
 * @function checkClassroomRole
 * @description Middleware factory to restrict access based on a user's role within a specific classroom.
 * Requires a 'classroomId' parameter in the URL.
 * Attaches a 'membership' object with the request, assuring the object is not null/undefined.
 * @param {string[]} allowedClassroomRoles - List of ClassroomRole enums (e.g., 'CREATOR', 'STUDENT').
 * @returns {function} An asynchronous Express middleware function.
 */
const checkClassroomRole = (...allowedClassroomRoles: string[]) => {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { classroomId } = req.params as { classroomId: string };
      const userId = req.user?.id as string;

      if (!classroomId?.trim() || !userId?.trim()) {
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

      if (
        !membership ||
        !allowedClassroomRoles.includes(membership.role) ||
        membership.membershipStatus === "PENDING"
      ) {
        throw new ForbiddenError(
          `This action is restricted to APPROVED ${allowedClassroomRoles.join(" or ")} role(s) only`,
        );
      }

      req.membership = membership;
      next();
    } catch (error) {
      next(error);
    }
  };
};

/** @constant isClassroomStudent - Access restricted to classroom members with role STUDENT */
export const isClassroomStudent = checkClassroomRole("STUDENT");

/** @constant isClassroomTutor - Access restricted to classroom members with role CREATOR or CO_TUTOR */
export const isClassroomTutor = checkClassroomRole("CREATOR", "CO_TUTOR");

/** @constant isCreator - Access restricted only to the classroom CREATOR */
export const isCreator = checkClassroomRole("CREATOR");

/** @constant isMember - Access restricted to any approved member (Student/Tutor/Creator) */
export const isMember = checkClassroomRole("STUDENT", "CREATOR", "CO_TUTOR");
