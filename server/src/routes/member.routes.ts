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
import { isClassroomTutor } from "../middlewares/auth.middleware.ts";

/**
 * @constant router
 * @type {Router}
 * @description Router instance with 'mergeParams' enabled to access ':classroomId' and handle member management requests.
 */
const router: Router = Router({ mergeParams: true });

/**
 * @section Base Member Routes
 * @url /api/v1/classrooms/:classroomId/members
 * @access Private (Classroom Member)
 */
router
    .route("/")
    /** 
     * @route GET /api/v1/classrooms/:classroomId/members 
     * @description Fetches all members (or filtered by PENDING/APPROVED status)
     */
    .get(memberController.getClassroomMembers as any);

/**
 * @section Member Removal
 * @url /api/v1/classrooms/:classroomId/members/:memberId
 * @access Private (Classroom Tutor)
 */
router
    .route("/:memberId")
    /** 
     * @route DELETE /api/v1/classrooms/:classroomId/members/:memberId 
     * @description Expels a member from the classroom.
     */
    .delete(isClassroomTutor as any, memberController.removeMember as any);

/**
 * @section Member Approval
 * @url /api/v1/classrooms/:classroomId/members/:studentId/approve
 * @access Private (Classroom Tutor)
 */
router
    .route("/:studentId/approve")
    /** 
     * @route PATCH /api/v1/classrooms/:classroomId/members/:studentId/approve 
     * @description Approves a student's pending join request.
     */
    .patch(isClassroomTutor as any, memberController.approveStudent as any);

/**
 * @section Fee Management
 * @url /api/v1/classrooms/:classroomId/members/:studentId/payment
 * @access Private (Classroom Tutor)
 */
router
    .route("/:studentId/payment")
    /** 
     * @route PATCH /api/v1/classrooms/:classroomId/members/:studentId/payment 
     * @description Updates the fee-validity period (expiry date) for a student.
     */
    .patch(isClassroomTutor as any, memberController.updateStudentPayment as any);

/**
 * @section Performance Analytics
 * @url /api/v1/classrooms/:classroomId/members/:studentId/performance
 * @access Private (Classroom Tutor - Enforced by classroom.routes.ts mount)
 */
router
    .route("/:studentId/performance")
    /** 
     * @route GET /api/v1/classrooms/:classroomId/members/:studentId/performance 
     * @description Fetches the performance data for a specific student to render analytics.
     */
    .get(memberController.getStudentPerformance as any);

export default router;