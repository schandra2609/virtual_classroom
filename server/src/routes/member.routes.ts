import { Router } from "express";
import * as memberController from "../controllers/member.controller.ts";

const router: Router = Router({ mergeParams: true });

router.route("/")
    .get(memberController.getClassroomMembers as any);

router.route("/:memberId")
    .delete(memberController.removeMember as any);

router.route("/:studentId/approve")
    .patch(memberController.approveStudent as any);

router
    .route("/:studentId/payment")
    .patch(memberController.updateStudentPayment as any);

export default router;