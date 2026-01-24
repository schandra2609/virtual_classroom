import { Router } from "express";
import { isClassroomStudent } from "../middlewares/auth.middleware.ts";
import * as testAttemptController from "../controllers/testattempt.controller.ts";

const router: Router = Router({ mergeParams: true });

router.route("/")
    .get(isClassroomStudent as any, testAttemptController.getMyAttemptsForPaper as any)
    .post(isClassroomStudent as any, testAttemptController.startTestAttempt as any);

router.route("/:attemptId/answers")
    .post(isClassroomStudent as any, testAttemptController.submitAnswer as any);

router.route("/:attemptId/submit")
    .post(isClassroomStudent as any, testAttemptController.submitTestAttempt as any);

router.route("/:attemptId/review")
    .get(testAttemptController.getAttemptReview as any);

export default router;