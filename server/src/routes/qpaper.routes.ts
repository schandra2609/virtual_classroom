import { Router } from "express";
import questionRouter from "./question.routes.ts";
import testAttemptRouter from "./testattempt.routes.ts";
import { createQuestionPaper, deleteQuestionPaper, getAllQuestionPapers, getQuestionPaperById, updateQuestionPaper } from "../controllers/qpaper.controller.ts";
import { isClassroomTutor } from "../middlewares/auth.middleware.ts";

const router: Router = Router({ mergeParams: true });

router.route("/")
    .get(getAllQuestionPapers as any)
    .post(isClassroomTutor as any, createQuestionPaper as any);

router.route("/:paperId")
    .get(getQuestionPaperById as any)
    .patch(isClassroomTutor as any, updateQuestionPaper as any)
    .delete(isClassroomTutor as any, deleteQuestionPaper as any);

router.use("/:paperId/question", isClassroomTutor as any, questionRouter);
router.use("/:paperId/attempts", testAttemptRouter);

export default router;