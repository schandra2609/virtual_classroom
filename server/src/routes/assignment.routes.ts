/**
 * @file assignment.routes.ts
 * @module Routes/Classroom/Assignments
 * @description Defines the routing table for classroom-based assignments.
 * Orchestrates access control between Tutors and Students and integrates
 * multipart/form-data parsing for file uploads.
 * @author Sayan Chandra
 */
import { Router } from "express";
import * as assignmentController from "../controllers/assignment.controller.ts";
import {
    isClassroomStudent,
    isClassroomTutor,
} from "../middlewares/auth.middleware.ts";
import { upload } from "../middlewares/upload.middleware.ts";

/**
 * @constant router
 * @description Express router instance with 'mergeParams' enabled.
 * Enabling mergeParams is critical to capture ':classroomId' from the parent route.
 */
const router: Router = Router({ mergeParams: true });

/**
 * @section Base Assignment Routes
 * URL: /api/v1/classrooms/:classroomId/assignments
 */
router
    .route("/")
    /**
     * @route GET /
     * @description Fetches all assignments for the classroom. Accessible by all members.
     */
    .get(assignmentController.getClassroomAssignments as any)

    /**
     * @route POST /
     * @description Creates a new assignment. Restricted to Tutors.
     * Integrates Multer to handle up to 3 instructional documents/images.
     */
    .post(
        isClassroomTutor as any,
        upload.array("attachments", 3),
        assignmentController.createAssignment as any,
    );

/**
 * @section Individual Assignment Management
 * URL: /api/v1/classrooms/:classroomId/assignments/:assignmentId
 */
router
    .route("/:assignmentId")
    /**
     * @route PATCH /:assignmentId
     * @description Updates assignment details or deadline. Restricted to Tutors.
     */
    .patch(
        isClassroomTutor as any,
        assignmentController.updateAssignment as any,
    )

    /**
     * @route DELETE - Cancel/Remove Assignment
     * @description UPDATED: Permanently removes assignment and associated cloud storage files.
     */
    .delete(
        isClassroomTutor as any,
        assignmentController.deleteAssignment as any,
    );

/**
 * @section Student Submission Logic
 * URL: /api/v1/classrooms/:classroomId/assignments/:assignmentId/submit
 */
router
    .route("/:assignmentId/submit")
    /**
     * @route POST /submit
     * @description Allows a student to upload their solution.
     * Enforces 'STUDENT' role and multipart file limit (Max 3 files).
     */
    .post(
        isClassroomStudent as any,
        upload.array("solutions", 3),
        assignmentController.submitSolution as any,
    );

/**
 * @section Tutor Review Logic
 * URL: /api/v1/classrooms/:classroomId/assignments/:assignmentId/submissions
 */
router
    .route("/:assignmentId/submissions")
    /**
     * @route GET /submissions
     * @description Fetches all student submissions for review. Restricted to Tutors.
     */
    .get(
        isClassroomTutor as any,
        assignmentController.getAssignmentSubmissions as any,
    );

export default router;
