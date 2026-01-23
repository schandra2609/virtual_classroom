import { Router } from "express";
import type { Request, Response } from "express";
import adminRouter from "./admin.routes.ts";
import authRouter from "./auth.routes.ts";
import userRouter from "./user.routes.ts";
import classroomRouter from "./classroom.routes.ts";
import { authorize, verifyToken } from "../middlewares/auth.middleware.ts";

const router: Router = Router();

router.use("/admin", verifyToken as any, authorize("ADMINISTRATOR") as any, adminRouter);
router.use("/auth", authRouter);
router.use("/users/me", verifyToken as any ,userRouter);
router.use("/classrooms", verifyToken as any, classroomRouter);

router.route("/health")
    .get((_req: Request, res: Response) => {
        res.status(200).json({
            success: true,
            message: "Virtual Classroom API is running",
        });
    });

export default router;