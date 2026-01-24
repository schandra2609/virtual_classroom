import { Router } from "express";
import * as questionController from "../controllers/question.controller.ts";

const router: Router = Router({ mergeParams: true });

router.route("/")
    .post(questionController.addQuestion as any);

router.route("/:questionId")
    .patch(questionController.updateQuestion as any)
    .delete(questionController.deleteQuestion as any);

export default router;