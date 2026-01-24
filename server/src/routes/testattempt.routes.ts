import { Router } from "express";
import { isClassroomStudent } from "../middlewares/auth.middleware.ts";
import { getAttemptReview, getMyAttemptsForPaper, startTestAttempt, submitAnswer, submitTestAttempt } from "../controllers/testattempt.controller.ts";

const router: Router = Router({ mergeParams: true });

router.route("/")
    .get(isClassroomStudent as any, getMyAttemptsForPaper as any)
    .post(isClassroomStudent as any, startTestAttempt as any);

router.route("/:attemptId/answers")
    .post(isClassroomStudent as any, submitAnswer as any);

router.route("/:attemptId/submit")
    .post(isClassroomStudent as any, submitTestAttempt as any);

router.route("/:attemptId/review")
    .get(getAttemptReview as any);

export default router;