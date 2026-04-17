/**
 * @file member.routes.ts
 * @module Routes/Classroom/Members
 * @description Routing for classroom roster management.
 * **Parent Context**: /api/v1/classrooms/:classroomId/members
 * Inherits ':classroomId' via mergeParams.
 * All routes here are restricted to classroom teaching staff (Tutors/Creators).
 * @author Sayan Chandra
 */
import { Router } from "express";
import * as memberController from "../controllers/member.controller.ts";

/**
 * @constant router
 * @type {Router}
 * @description Router instance with 'mergeParams' enabled to access ':classroomId' and handle member management requests.
 */
const router: Router = Router({ mergeParams: true });

/**
 * @route GET /api/v1/classrooms/:classroomId/members
 * @description Fetches all members (or filtered by PENDING/APPROVED status).
 * @access Private (Classroom Tutor)
 */
router.route("/").get(memberController.getClassroomMembers as any);

/**
 * @route DELETE /api/v1/classrooms/:classroomId/members/:memberId
 * @description Expels a member from the classroom.
 * @access Private (Classroom Tutor)
 */
router.route("/:memberId").delete(memberController.removeMember as any);

/**
 * @route PATCH /api/v1/classrooms/:classroomId/members/:studentId/approve
 * @description Approves a student's pending join request.
 * @access Private (Classroom Tutor)
 */
router
    .route("/:studentId/approve")
    .patch(memberController.approveStudent as any);

/**
 * @route PATCH /api/v1/classrooms/:classroomId/members/:studentId/payment
 * @description Updates the fee-validity period (expiry date) for a student.
 * @access Private (Classroom Tutor)
 */
router
    .route("/:studentId/payment")
    .patch(memberController.updateStudentPayment as any);

/**
 * @route GET /api/v1/classrooms/:classroomId/members/:studentId/performance
 * @description Fetches the performance data for a specific student to render analytics.
 * @access Private (Classroom Tutor - Enforced by classroom.routes.ts mount)
 */
router
    .route("//:studentId/performance")
    .get(memberController.getStudentPerformance as any);

export default router;
