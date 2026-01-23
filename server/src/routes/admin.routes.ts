import { Router } from "express";
import { approveTutor, getTutorApplications, rejectTutor } from "../controllers/admin.controller.ts";

const router: Router = Router();

router.route("/tutors")
    .get(getTutorApplications as any);

router.route("/tutors/:tutorId/approve")
    .patch(approveTutor as any);

router.route("/tutors/:tutorId/reject")
    .patch(rejectTutor as any);

export default router;