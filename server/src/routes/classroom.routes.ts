import { Router } from "express";
import memberRouter from "./member.routes.ts";
import {
    authorize,
    isCreator,
    isMember,
    verifyToken,
} from "../middlewares/auth.middleware.ts";
import {
    createClassroom,
    deleteClassroom,
    getClassroomById,
    getMyClassrooms,
    inviteCoTutor,
    joinClassroom,
    leaveClassroom,
    refreshJoiningCode,
    transferOwnership,
    updateClassroom,
} from "../controllers/classroom.controller.ts";


const router: Router = Router();

router.use(verifyToken as any);

router.route("/")
    .get(getMyClassrooms as any)
    .post(authorize("TUTOR") as any, createClassroom as any);

router.route("/join")
    .post(authorize("STUDENT") as any, joinClassroom as any);

router.route("/:classroomId")
    .get(isMember as any, getClassroomById as any)
    .patch(isCreator as any, updateClassroom as any)
    .delete(isCreator as any, deleteClassroom as any);

router.route("/:classroomId/leave")
    .delete(isMember as any, leaveClassroom as any);

router.route("/:classroomId/invite-tutor")
    .post(isCreator as any, inviteCoTutor as any);

router.route("/:classroomId/refresh-code")
    .patch(isCreator as any, refreshJoiningCode as any);

router.route("/:classroomId/transfer-ownership")
    .patch(isCreator as any, transferOwnership as any);

router.use("/members", memberRouter);

export default router;