import { Router } from "express";
import type { Request, Response } from "express";
import authRouter from "./auth.routes.ts"

const router = Router();

router.use("/auth", authRouter);

router.route('/health')
    .get((_req: Request, res: Response) => {
        res.status(200).json({
            success: true,
            message: "Virtual Classroom API is running"
        });
    });

export default router;