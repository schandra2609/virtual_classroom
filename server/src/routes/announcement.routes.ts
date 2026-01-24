import { Router } from "express";
import commentRouter from "./comment.routes.ts";
import { isClassroomTutor } from "../middlewares/auth.middleware.ts";
import * as announcementController from "../controllers/announcement.controller.ts";
import { upload } from "../middlewares/upload.middleware.ts";

const router: Router = Router({ mergeParams: true });

router.route("/")
    .get(announcementController.getAnnouncements as any)
    .post(isClassroomTutor as any, upload.array("attachments", 5), announcementController.createAnnouncement as any);

router.route("/:announcementId")
    .delete(isClassroomTutor as any, announcementController.deleteAnnouncement as any);

router.use("/:announcementId/comments", commentRouter);

export default router;