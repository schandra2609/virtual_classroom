import { Router } from "express";
import { isClassroomTutor } from "../middlewares/auth.middleware.ts";
import { approveStudent, getClassroomMembers, removeMember, updateStudentPayment } from "../controllers/member.controller.ts";

const router: Router = Router({ mergeParams: true });

router.use(isClassroomTutor as any);

router.route("/")
    .get(getClassroomMembers as any);

router.route("/:memberId")
    .delete(removeMember as any);

router.route("/:studentId/approve")
    .patch(approveStudent as any);

router
    .route("/:studentId/payment")
    .patch(updateStudentPayment as any);

export default router;