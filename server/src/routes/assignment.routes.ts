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
import { isClassroomStudent, isClassroomTutor } from "../middlewares/auth.middleware.ts";
import { upload } from "../middlewares/upload.middleware.ts";

/**
 * @constant router
 * @description Express router instance with 'mergeParams' enabled.
 * Enabling mergeParams is critical to capture ':classroomId' from the parent route.
 */
const router: Router = Router({ mergeParams: true });

/**
 * @section Base Assignment Routes
 * @url /api/v1/classrooms/:classroomId/assignments
 * @access Private (Classroom Members)
 */
router
    .route("/")
    /**
     * @route GET /api/v1/classrooms/:classroomId/assignments
     * @description Fetches all assignments for the classroom.
     */
    .get(assignmentController.getClassroomAssignments as any)

    /**
     * @route POST /api/v1/classrooms/:classroomId/assignments
     * @description Creates a new assignment. Restricted to Tutors.
     */
    .post(
        isClassroomTutor as any,
        upload.array("attachments", 3),
        assignmentController.createAssignment as any,
    );

/**
 * @section Individual Assignment Management
 * @url /api/v1/classrooms/:classroomId/assignments/:assignmentId
 */
router
    .route("/:assignmentId")
    /**
     * @route PATCH /api/v1/classrooms/:classroomId/assignments/:assignmentId
     * @description Updates assignment details or deadline. Restricted to Tutors.
     */
    .patch(
        isClassroomTutor as any,
        assignmentController.updateAssignment as any,
    )

    /**
     * @route DELETE /api/v1/classrooms/:classroomId/assignments/:assignmentId
     * @description Permanently removes assignment and associated cloud storage files.
     */
    .delete(
        isClassroomTutor as any,
        assignmentController.deleteAssignment as any,
    );

/**
 * @section Student Submission Logic
 * @url /api/v1/classrooms/:classroomId/assignments/:assignmentId/submit
 */
router
    .route("/:assignmentId/submit")
    /**
     * @route POST /api/v1/classrooms/:classroomId/assignments/:assignmentId/submit
     * @description Allows a student to upload their solution.
     */
    .post(
        isClassroomStudent as any,
        upload.array("solutions", 3),
        assignmentController.submitSolution as any,
    );

/**
 * @section Tutor Review Logic
 * @url /api/v1/classrooms/:classroomId/assignments/:assignmentId/submissions
 */
router
    .route("/:assignmentId/submissions")
    /**
     * @route GET /api/v1/classrooms/:classroomId/assignments/:assignmentId/submissions
     * @description Fetches all student submissions for review. Restricted to Tutors.
     */
    .get(
        isClassroomTutor as any,
        assignmentController.getAssignmentSubmissions as any,
    );

/**
 * @section Tutor Grading Logic
 * @url /api/v1/classrooms/:classroomId/assignments/:assignmentId/submissions/:submissionId/grade
 */
router
    .route("/:assignmentId/submissions/:submissionId/grade")
    /**
     * @route PATCH /api/v1/classrooms/:classroomId/assignments/:assignmentId/submissions/:submissionId/grade
     * @description Allows a tutor to assign or update a grade for a submission.
     */
    .patch(
        isClassroomTutor as any,
        assignmentController.gradeSubmission as any,
    );

export default router;