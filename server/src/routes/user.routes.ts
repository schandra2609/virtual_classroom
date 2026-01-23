import { Router } from "express";
import { authorize } from "../middlewares/auth.middleware.ts";
import { changePassword, getCurrentUser, sendVerificationOtp, submitQualification, updateCurrentUser, verifyEmail } from "../controllers/user.controller.ts";

const router: Router = Router();

router.route("/")
    .get(getCurrentUser as any)
    .patch(updateCurrentUser as any);

router.route("/change-password")
    .patch(changePassword as any);

router.route("/send-verification-otp")
    .post(sendVerificationOtp as any);

router.route("/verify-email")
    .post(verifyEmail as any);

router.route("/submit-qualifications")
    .post(authorize("TUTOR") as any, submitQualification as any);

export default router;