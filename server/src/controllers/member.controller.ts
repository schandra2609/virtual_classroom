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

/**
 * @async
 * @function getClassroomMembers
 * @description Retrieves a list of classroom members filtered by their membership status.
 * @param {AuthenticatedRequest} req - Request containing 'classroomId' in params and 'status' in query.
 * @param {Response} res - Success response with the array of members and their basic profiles.
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
        if (![classroomId, status].every((field) => field.trim())) {
            throw new BadRequestError("Classroom ID, status are required.");
        }

        const normalizedStatus = status?.trim().toUpperCase();
        const whereClause: Partial<{
            classroomId: string;
            membershipStatus: string;
        }> = { classroomId: classroomId };
        // Apply status filter if it matches valid enum values
        if (["APPROVED", "PENDING"].includes(normalizedStatus)) {
            whereClause.membershipStatus = normalizedStatus;
        }

        const members = await prisma.classroomMember.findMany({
            where: whereClause as any,
            include: {
                user: { select: { id: true, fullName: true, email: true } },
            },
            orderBy: { joinedAt: "asc" },
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
        const { classroomId, studentId } = req.params;

        // 1. Fetch the student's basic details to display in the UI
        // Replace with your actual DB call, e.g., prisma.user.findUnique(...) or raw SQL
        const student = await prisma.user.findUnique({
            where: { id: studentId as string },
        });
        if (!student) {
            throw new NotFoundError("Student not found in the system.");
        }

        // 2. Fetch all completed CBT Exams for this specific classroom
        // We only want papers that have been graded or submitted
        const classroomTests = await prisma.questionPaper.findMany({
            where: {
                classroomId: classroomId as string,
                status: "COMPLETED",
            },
            select: { id: true, title: true },
        });

        if (classroomTests.length === 0) {
            res.status(200).json({
                studentName: student.fullName,
                performanceData: [], // No tests taken yet
            });
        }

        const testIds = classroomTests.map((test) => test.id);

        // 3. AGGREGATION: Get the Highest Score for each test in the classroom
        // SQL Equivalent: SELECT paperId, MAX(score) as highestScore FROM test_attempts GROUP BY paperId
        const highestScoresRaw = await prisma.testAttempt.groupBy({
            by: ["questionPaperId"],
            where: { questionPaperId: { in: testIds } },
            _max: { score: true },
        });

        // 4. Fetch the specific Student's scores for these tests
        const studentScoresRaw = await prisma.testAttempt.findMany({
            where: {
                questionPaperId: { in: testIds },
                studentId: studentId as string,
            },
            select: { questionPaperId: true, score: true },
        });

        // 5. Map the relational data into the exact format Recharts expects
        const performanceData = classroomTests.map((test) => {
            // Find the student's score for this test (default to 0 if they missed it)
            const studentAttempt = studentScoresRaw.find(
                (s) => s.questionPaperId === test.id,
            );
            const studentScore = studentAttempt ? studentAttempt.score : 0;

            // Find the highest score for this test (default to 0 if no one took it)
            const highestAttempt = highestScoresRaw.find(
                (h) => h.questionPaperId === test.id,
            );
            const highestScore = highestAttempt ? highestAttempt._max.score : 0;

            return {
                testName: test.title,
                studentScore: studentScore,
                highestScore: highestScore,
            };
        });

        // 6. Send the formatted data back to the frontend
        res.status(200).json({
            studentName: student.fullName,
            performanceData: performanceData,
        });
    } catch (error) {
        next(error);
    }
};
