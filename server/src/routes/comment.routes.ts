import { Router } from "express";
import * as commentController from "../controllers/comment.controller.ts";

const router: Router = Router({ mergeParams: true });

router.route("/")
    .get(commentController.getCommentsForAnnouncement as any)
    .post(commentController.createComment as any);

router.route("/:commentId")
    .patch(commentController.updateComment as any)
    .delete(commentController.deleteComment as any);

export default router;