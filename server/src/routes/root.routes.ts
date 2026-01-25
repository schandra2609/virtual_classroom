/**
 * @file root.routes.ts
 * @module Routes/Root
 * @description The central routing hub for the Virtual Classroom API.
 * This module orchestrates the mounting of all sub-routers and applies
 * global version-level security policies.
 * @author Sayan Chandra
 */
import { Router } from "express";
import type { Request, Response } from "express";
import adminRouter from "./admin.routes.ts";
import authRouter from "./auth.routes.ts";
import userRouter from "./user.routes.ts";
import classroomRouter from "./classroom.routes.ts";
import invitationRouter from "./invitation.routes.ts";
import { authorize, verifyToken } from "../middlewares/auth.middleware.ts";

/**
 * @constant router
 * @type {Router}
 * @description Root router mounted at the versioned base path (e.g., /api/v1).
 */
const router: Router = Router();

/**
 * @section Sub-Routers Mounting
 */

/** 
 * @route /api/v1/admin
 * @access Private (ADMINISTRATOR only)
 */
router.use("/admin", verifyToken as any, authorize("ADMINISTRATOR") as any, adminRouter);

/** 
 * @route /api/v1/auth
 * @access Public / Private (Mix)
 */
router.use("/auth", authRouter);

/** 
 * @route /api/v1/users/me
 * @access Private (Authenticated Users)
 */
router.use("/users/me", verifyToken as any ,userRouter);

/** 
 * @route /api/v1/classrooms
 * @access Private (Authenticated Users)
 */
router.use("/classrooms", verifyToken as any, classroomRouter);

/** 
 * @route /api/v1/invitations
 * @access Private (TUTOR only)
 */
router.use("/invitations", verifyToken as any, authorize("TUTOR") as any, invitationRouter);

/**
 * @route GET /api/v1/health
 * @description System health check endpoint to verify API availability.
 * @access Public
 */
router.route("/health")
    .get((_req: Request, res: Response) => {
        res.status(200).json({
            success: true,
            message: "Virtual Classroom API is running",
        });
    });

export default router;