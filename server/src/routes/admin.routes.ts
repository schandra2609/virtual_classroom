import { Router } from "express";
import * as adminController from "../controllers/admin.controller.ts";

const router: Router = Router();

router.route("/tutors")
    .get(adminController.getTutorApplications as any);

router.route("/tutors/:tutorId/approve")
    .patch(adminController.approveTutor as any);

router.route("/tutors/:tutorId/reject")
    .patch(adminController.rejectTutor as any);

export default router;