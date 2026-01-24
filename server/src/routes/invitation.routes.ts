import { Router } from "express";
import { acceptCoTutorInvitation, getMyInvitations } from "../controllers/invitation.controller.ts";

const router: Router = Router();

router.route("/")
    .get(getMyInvitations as any);

router.route("/:invitationId/accept")
    .post(acceptCoTutorInvitation as any);

export default router;