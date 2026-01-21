import { Router } from "express";
import type { Request, Response } from "express";
import authRouter from "./auth.routes.ts";
import userRouter from "./user.routes.ts";

const router: Router = Router();

router.use("/auth", authRouter);
router.use("/users/me", userRouter);

router.route("/health")
    .get((_req: Request, res: Response) => {
        res.status(200).json({
            success: true,
            message: "Virtual Classroom API is running"
        });
    });

export default router;