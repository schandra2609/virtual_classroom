import { Router } from "express";
import { addQuestion, deleteQuestion, updateQuestion } from "../controllers/question.controller.ts";

const router: Router = Router({ mergeParams: true });

router.route("/")
    .post(addQuestion as any);

router.route("/:questionId")
    .patch(updateQuestion as any)
    .delete(deleteQuestion as any);

export default router;