import { Router } from "express";
import commentRouter from "./comment.routes.ts";
import { isClassroomTutor } from "../middlewares/auth.middleware.ts";
import { createAnnouncement, deleteAnnouncement, getAnnouncements } from "../controllers/announcement.controller.ts";

const router: Router = Router({ mergeParams: true });

router.route("/")
    .get(getAnnouncements as any)
    .post(isClassroomTutor as any, createAnnouncement as any);

router.route("/:announcementId")
    .delete(isClassroomTutor as any, deleteAnnouncement as any);

router.use("/:announcementId/comments", commentRouter);

export default router;