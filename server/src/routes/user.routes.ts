import { Router } from "express";
import { authorize } from "../middlewares/auth.middleware.ts";
import * as userController from "../controllers/user.controller.ts";
import { upload } from "../middlewares/upload.middleware.ts";

const router: Router = Router();

router.route("/")
    .get(userController.getCurrentUser as any)
    .patch(userController.updateCurrentUser as any);

router.route("/change-password")
    .patch(userController.changePassword as any);

router.route("/send-verification-otp")
    .post(userController.sendVerificationOtp as any);

router.route("/verify-email")
    .post(userController.verifyEmail as any);

router.route("/profile-photo")
    .patch(upload.single("image"), userController.uploadProfilePhoto as any);

router.route("/submit-qualifications")
    .post(authorize("TUTOR") as any, upload.single("document"), userController.uploadQualificationProof as any);

export default router;