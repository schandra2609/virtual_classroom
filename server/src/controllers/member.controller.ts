/**
 * @file member.controller.ts
 * @module Controllers/Classroom/Members
 * @description Controller handling classroom-level user management.
 * Includes roster retrieval, removal logic with hierarchical role checks,
 * student admission approval, and subscription/payment management.
 * @author Sayan Chandra
 */
import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.ts";
import {
    BadRequestError,
    ForbiddenError,
    NotFoundError,
} from "../utils/Error.ts";
import { prisma } from "../configs/database.config.ts";
import { dayjs } from "../configs/dayjs.config.ts";
import { getPresignedUrl } from "../services/storage.service.ts";

/**
 * @async
 * @function getClassroomMembers
 * @description Retrieves a list of classroom members filtered by their membership status and the caller's role. 
 * If the caller is a STUDENT, the database query is strictly restricted to return only CREATOR and CO_TUTOR roles.
 * @param {AuthenticatedRequest} req - Request containing 'classroomId', 'status', and the user context.
 * @param {Response} res - Success response with the array of allowed members and their basic profiles.
 * @param {NextFunction} next - Error propagation.
 * @throws {BadRequestError} 400 - If classroomId or status is missing.
 * @returns {Promise<void>}
 */
export const getClassroomMembers = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const { classroomId } = req.params as { classroomId: string };
        const { status } = req.query as { status: string };
        
        if (![classroomId, status].every((field) => field?.trim())) {
            throw new BadRequestError("Classroom ID and status are required.");
        }

        const normalizedStatus = status?.trim().toUpperCase();
        
        // Dynamic Role-Based Database Query
        const whereClause: any = { classroomId: classroomId };

        if (["APPROVED", "PENDING"].includes(normalizedStatus)) {
            whereClause.membershipStatus = normalizedStatus;
        }

        if (req.user?.accountType === "STUDENT") {
            whereClause.role = { in: ["CREATOR", "CO_TUTOR"] };
            whereClause.membershipStatus = "APPROVED";
        }

        const members = await prisma.classroomMember.findMany({
            where: whereClause,
            include: {
                user: { select: {
                    id: true,
                    fullName: true,
                    email: true,
                    profilePhotoUrl: true,
                    accountType: true,
                }},
            },
            orderBy: { joinedAt: "asc" },
        });

        // Map MinIO paths to secure Presigned URLs
        const formattedData = await Promise.all(
            members.map(async (member) => {
                if (member.user?.profilePhotoUrl && !member.user.profilePhotoUrl.startsWith("http")) {
                    member.user.profilePhotoUrl = await getPresignedUrl(member.user.profilePhotoUrl);
                }
                return member;
            })
        );

        res.status(200).json({
            success: true,
            data: formattedData,
            message: "Classroom members fetched successfully",
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @async
 * @function removeMember
 * @description Removes a user from the classroom. Enforces hierarchical security rules.
 * **Security Rules:**
 * 1. A user cannot remove themselves (must use /leave route).
 * 2. The 'CREATOR' (owner) cannot be removed from the classroom.
 * 3. 'CO_TUTOR's cannot remove other 'CO_TUTOR's; only the 'CREATOR' can do this.
 * @param {AuthenticatedRequest} req - Request containing 'classroomId' and 'memberId' (the target) in params.
 * @returns {Promise<void>}
 */
export const removeMember = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const { classroomId, memberId } = req.params as {
            classroomId: string;
            memberId: string;
        };
        const remover = req.membership; // Populated by isClassroomTutor middleware
        if (![classroomId, memberId].every((field) => field.trim())) {
            throw new BadRequestError("Classroom ID, member ID are required.");
        }
        if (remover?.userId === memberId) {
            throw new BadRequestError(
                "You cannot remove yourself from a classroom.",
            );
        }

        const memberToRemove = await prisma.classroomMember.findUnique({
            where: {
                userId_classroomId: {
                    userId: memberId,
                    classroomId: classroomId,
                },
            },
        });
        if (!memberToRemove) {
            throw new NotFoundError("Member not found in this classroom");
        }
        /** @section Hierarchical Permission Validation */
        if (memberToRemove.role === "CREATOR") {
            throw new ForbiddenError(
                "The creator of the classroom cannot be removed.",
            );
        }
        if (
            memberToRemove.role === "CO_TUTOR" &&
            remover?.role === "CO_TUTOR"
        ) {
            throw new ForbiddenError("Co-tutors can't remove co-tutors");
        }

        await prisma.classroomMember.delete({
            where: {
                userId_classroomId: {
                    userId: memberId,
                    classroomId: classroomId,
                },
            },
        });
        res.status(200).json({
            success: true,
            message: "Member removed from the classroom",
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @async
 * @function approveStudent
 * @description Transitions a student's membership from 'PENDING' to 'APPROVED'.
 * This grants the student access to classroom materials and announcements.
 * @param {AuthenticatedRequest} req - Request containing 'classroomId' and 'studentId' in params.
 * @returns {Promise<void>}
 */
export const approveStudent = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const approverId = req.user?.id as string;
        const { classroomId, studentId } = req.params as {
            classroomId: string;
            studentId: string;
        };
        if (
            ![approverId, classroomId, studentId].every((field) =>
                field?.trim(),
            )
        ) {
            throw new BadRequestError(
                "Approver ID, classroom ID, student ID are required.",
            );
        }

        const membershipToApprove = await prisma.classroomMember.findUnique({
            where: {
                userId_classroomId: {
                    userId: studentId,
                    classroomId: classroomId,
                },
                role: "STUDENT",
                membershipStatus: "PENDING",
            },
        });
        if (!membershipToApprove) {
            throw new NotFoundError(
                "No pending join request for this student found in this classroom",
            );
        }

        const updatedMembership = await prisma.classroomMember.update({
            where: {
                userId_classroomId: {
                    userId: studentId,
                    classroomId: classroomId,
                },
            },
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

/**
 * @async
 * @function updateStudentPayment
 * @description Manages fee-based access validity (subscription management).
 * **Date Logic:**
 * - If the student's current access is still valid, the new duration is appended to the expiry date.
 * - If the student's access has expired, the duration is added starting from the current time.
 * @param {AuthenticatedRequest} req - Body: { durationInMonths }. Params: { classroomId, studentId }.
 * @returns {Promise<void>}
 */
export const updateStudentPayment = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const { classroomId, studentId } = req.params as {
            classroomId: string;
            studentId: string;
        };
        if (![classroomId, studentId].every((field) => field.trim())) {
            throw new BadRequestError(
                "Missing values: classroom id, student id",
            );
        }

        const { durationInMonths } = req.body as { durationInMonths: number };
        if (![1, 3, 6, 12].includes(durationInMonths)) {
            throw new BadRequestError("Invalid payment duration");
        }

        const membership = await prisma.classroomMember.findUnique({
            where: {
                userId_classroomId: {
                    userId: studentId,
                    classroomId: classroomId,
                },
            },
        });
        if (membership?.role !== "STUDENT") {
            throw new NotFoundError(
                "No student membership found in the classroom",
            );
        }

        /** @section Expiry Calculation Logic */
        const now = dayjs();
        const currentExpiry = dayjs(membership.feePaidUntil);

        // Calculate the base date to start adding time from
        const startDate = currentExpiry.isAfter(now) ? currentExpiry : now;
        const newExpiryDate = startDate.add(durationInMonths, "month").toDate();
        const updatedmembership = await prisma.classroomMember.update({
            where: {
                userId_classroomId: {
                    userId: studentId,
                    classroomId: classroomId,
                },
            },
            data: { feePaidUntil: newExpiryDate },
        });
        res.status(200).json({
            success: true,
            data: updatedmembership,
            message: `Student's payment verified. Access granted until ${dayjs(newExpiryDate).format("DD MMM, YYYY")}.`,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @function getStudentPerformance
 * @description Analyzes a specific student's test scores against the class maximums.
 * Formats the output specifically for the Recharts frontend component.
 */
export const getStudentPerformance = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const { classroomId, studentId } = req.params as { classroomId: string, studentId: string };
        const requesterId = req.user?.id;
        const requesterRole = req.membership?.role;

        if (requesterRole === "STUDENT" && requesterId !== studentId)
            throw new ForbiddenError("You are not authorized to view another student's analytics.");

        // 1. Fetch ALL valid exams to build the complete X-axis baseline
        const validPapers = await prisma.questionPaper.findMany({
            where: {
                classroomId: classroomId,
                status: { not: "CANCELLED" } // Discard cancelled exams
            },
            include: {
                questions: { select: { marks: true } },
                attempts: {
                    where: { type: "OFFICIAL", submittedAt: { not: null } },
                    select: { studentId: true, score: true }
                }
            },
            orderBy: { liveAt: "asc" } // Chronological order
        });

        // 2. Map every exam to a chart data point
        const chartData = validPapers.map((paper) => {
            const maxScore = paper.questions.reduce((sum, q) => sum + q.marks, 0);
            
            let highestPercentage = 0;
            let studentPercentage: number | null = null;

            if (maxScore > 0) {
                for (const attempt of paper.attempts) {
                    const rawScore = attempt.score || 0;
                    const percentage = (rawScore / maxScore) * 100;
                    const roundedPercentage = Math.round(percentage * 100) / 100;

                    if (roundedPercentage > highestPercentage) {
                        highestPercentage = roundedPercentage;
                    }

                    if (attempt.studentId === studentId) {
                        studentPercentage = roundedPercentage;
                    }
                }
            }

            // 3. Enforce the "0 if not appeared" rule
            const finalStudentScore = studentPercentage !== null ? studentPercentage : 0;

            return {
                examName: paper.title,
                "Highest Score": highestPercentage,
                "Student Score": finalStudentScore,
                liveAt: paper.liveAt
            };
        });

        res.status(200).json({
            success: true,
            data: chartData,
            message: "Performance analytics generated successfully."
        });
    } catch (error) {
        next(error);
    }
};
