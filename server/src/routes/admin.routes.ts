import { Router } from "express";
import { authorize, verifyToken } from "../middlewares/auth.middleware.ts";
import { approveTutor, getTutorApplications, rejectTutor } from "../controllers/admin.controller.ts";

const router: Router = Router();

router.use(verifyToken as any, authorize("ADMINISTRATOR") as any);

router.route("/tutors")
    .get(getTutorApplications as any);

router.route("/tutors/:tutorId/approve")
    .patch(approveTutor as any);

router.route("/tutors/:tutorId/reject")
    .patch(rejectTutor as any);

export default router;