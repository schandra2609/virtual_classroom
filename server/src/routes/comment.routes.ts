import { Router } from "express";
import { createComment, deleteComment, getCommentsForAnnouncement, updateComment } from "../controllers/comment.controller.ts";

const router: Router = Router({ mergeParams: true });

router.route("/")
    .get(getCommentsForAnnouncement as any)
    .post(createComment as any);

router.route("/:commentId")
    .patch(updateComment as any)
    .delete(deleteComment as any);

export default router;