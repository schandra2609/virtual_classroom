import { Router } from "express";
import announcementRouter from "./announcement.routes.ts";
import assignmentRouter from "./assignment.routes.ts";
import memberRouter from "./member.routes.ts";
import qPaperRouter from "./qpaper.routes.ts";
import {
    authorize,
    isClassroomTutor,
    isCreator,
    isMember,
} from "../middlewares/auth.middleware.ts";
import * as classroomController from "../controllers/classroom.controller.ts";

const router: Router = Router();

router.route("/")
    .get(classroomController.getMyClassrooms as any)
    .post(authorize("TUTOR") as any, classroomController.createClassroom as any);

router.route("/join")
    .post(authorize("STUDENT") as any, classroomController.joinClassroom as any);

router.route("/:classroomId")
    .get(isMember as any, classroomController.getClassroomById as any)
    .patch(isCreator as any, classroomController.updateClassroom as any)
    .delete(isCreator as any, classroomController.deleteClassroom as any);

router.route("/:classroomId/leave")
    .delete(isMember as any, classroomController.leaveClassroom as any);

router.route("/:classroomId/invite-tutor")
    .post(isCreator as any, classroomController.inviteCoTutor as any);

router.route("/:classroomId/refresh-code")
    .patch(isCreator as any, classroomController.refreshJoiningCode as any);

router.route("/:classroomId/transfer-ownership")
    .patch(isCreator as any, classroomController.transferOwnership as any);

router.use("/:classroomId/announcements", isMember as any, announcementRouter);
router.use("/:classroomId/assignments", isMember as any, assignmentRouter);
router.use("/:classroomId/members", isClassroomTutor as any, memberRouter);
router.use("/:classroomId/papers", isMember as any, qPaperRouter);

export default router;