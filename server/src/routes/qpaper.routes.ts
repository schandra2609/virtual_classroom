import { Router } from "express";
import questionRouter from "./question.routes.ts";
import testAttemptRouter from "./testattempt.routes.ts";
import * as qpaperController from "../controllers/qpaper.controller.ts";
import { isClassroomTutor } from "../middlewares/auth.middleware.ts";

const router: Router = Router({ mergeParams: true });

router.route("/")
    .get(qpaperController.getAllQuestionPapers as any)
    .post(isClassroomTutor as any, qpaperController.createQuestionPaper as any);

router.route("/:paperId")
    .get(qpaperController.getQuestionPaperById as any)
    .patch(isClassroomTutor as any, qpaperController.updateQuestionPaper as any)
    .delete(isClassroomTutor as any, qpaperController.deleteQuestionPaper as any);

router.use("/:paperId/questions", isClassroomTutor as any, questionRouter);
router.use("/:paperId/attempts", testAttemptRouter);

export default router;