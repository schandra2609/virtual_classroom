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
 */
router
    .route("/")
    /** @route GET / - Fetch my attempt history for this paper */
    .get(
        isClassroomStudent as any,
        testAttemptController.getMyAttemptsForPaper as any,
    )
    /** @route POST / - Start a new Practice or Official attempt */
    .post(
        isClassroomStudent as any,
        testAttemptController.startTestAttempt as any,
    );

/**
 * @section Active Session Logic
 */
router
    .route("/:attemptId/answers")
    /** @route POST /:attemptId/answers - Sync answers in real-time */
    .post(isClassroomStudent as any, testAttemptController.submitAnswer as any);

router
    .route("/:attemptId/submit")
    /** @route POST /:attemptId/submit - Finalize and trigger the grading engine */
    .post(
        isClassroomStudent as any,
        testAttemptController.submitTestAttempt as any,
    );

/**
 * @section Results & Feedback
 */
router
    .route("/:attemptId/review")
    /** @route GET /:attemptId/review - Detailed feedback report (Owners & Staff) */
    .get(testAttemptController.getAttemptReview as any);

export default router;
