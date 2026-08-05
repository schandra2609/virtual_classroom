/**
 * @file testattempt.routes.ts
 * @module Routes/Classroom/QuestionPapers/Attempts
 * @description Endpoints for the test execution lifecycle.
 * Parent Context: /api/v1/classrooms/:classroomId/papers/:paperId/attempts
 * @author Sayan Chandra
 */
import { Router } from "express";
import { isClassroomStudent } from "../middlewares/auth.middleware.ts";
import * as testAttemptController from "../controllers/testattempt.controller.ts";

/**
 * @constant router
 * @type {Router}
 * @description Utilizes 'mergeParams: true' to capture classroom and paper context from parent.
 */
const router: Router = Router({ mergeParams: true });

/**
 * @section Attempt Initialization & History
 * @access Private (Classroom Student)
 * @url /api/v1/classrooms/:classroomId/papers/:paperId/attempts
 */
router
    .route("/")
    /**
     * @route GET /api/v1/classrooms/:classroomId/papers/:paperId/attempts
     * @description Fetch my attempt history for this paper.
     * @access Private (Classroom Student)
     */
    .get(
        isClassroomStudent as any,
        testAttemptController.getMyAttemptsForPaper as any,
    )
    /**
     * @route POST /api/v1/classrooms/:classroomId/papers/:paperId/attempts
     * @description Start a new Practice or Official attempt.
     * @access Private (Classroom Student)
     */
    .post(
        isClassroomStudent as any,
        testAttemptController.startTestAttempt as any,
    );

/**
 * @section Active Session Logic
 * @url /api/v1/classrooms/:classroomId/papers/:paperId/attempts/:attemptId/answers
 * @access Private (Classroom Student)
 */
router
    .route("/:attemptId/answers")
    /**
     * @route POST /api/v1/classrooms/:classroomId/papers/:paperId/attempts/:attemptId/answers
     * @description Sync answers in real-time.
     * @access Private (Classroom Student)
     */
    .post(isClassroomStudent as any, testAttemptController.submitAnswer as any);

/**
 * @section Finalization
 * @url /api/v1/classrooms/:classroomId/papers/:paperId/attempts/:attemptId/submit
 * @access Private (Classroom Student)
 */
router
    .route("/:attemptId/submit")
    /**
     * @route POST /api/v1/classrooms/:classroomId/papers/:paperId/attempts/:attemptId/submit
     * @description Finalize and trigger the grading engine.
     * @access Private (Classroom Student)
     */
    .post(
        isClassroomStudent as any,
        testAttemptController.submitTestAttempt as any,
    );

/**
 * @section Results & Feedback
 * @url /api/v1/classrooms/:classroomId/papers/:paperId/attempts/:attemptId/review
 * @access Private (Classroom Student)
 */
router
    .route("/:attemptId/review")
    /**
     * @route GET /api/v1/classrooms/:classroomId/papers/:paperId/attempts/:attemptId/review
     * @description Detailed feedback report (Owners & Staff).
     * @access Private (Classroom Student)
     */
    .get(testAttemptController.getAttemptReview as any);

export default router;