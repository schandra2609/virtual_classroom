/**
 * @file user.controller.ts
 * @module Controllers/User
 * @description Controller logic for managing profile and document uploads.
 * Implements dynamic status joins for the decoupled TutorApplication schema.
 * @author Sayan Chandra
 */
import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.ts";
import bcrypt from "bcrypt";
import { BadRequestError, ConflictError, ForbiddenError } from "../utils/Error.ts";
import { prisma } from "../configs/database.config.ts";
import { dayjs } from "../configs/dayjs.config.ts";
import { getPresignedUrl, uploadBuffer } from "../services/storage.service.ts";
import { sendOTP } from "../services/email.service.ts";

/**
 * @function getCurrentUser
 * @description Retrieves the full profile of the currently authenticated user from the request context.
 * @param {AuthenticatedRequest} req - The request object populated by verifyToken middleware.
 * @param {Response} res - Express response object.
 * @param {NextFunction} next - Error propagation function.
 * @returns {void}
 */
export const getCurrentUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const user = req.user as any;

        // Dynamically fetch and attach the tutor status for the frontend
        if (user.accountType === "TUTOR") {
            const latestApp = await prisma.tutorApplication.findFirst({
                where: { userId: user.id },
                orderBy: { createdAt: "desc" }
            });
            user.tutorVerificationStatus = latestApp ? latestApp.status : null;
        }

        if (user.profilePhotoUrl && !user.profilePhotoUrl.startsWith("http")) {
            user.profilePhotoUrl = await getPresignedUrl(user.profilePhotoUrl);
        }

        res.status(200).json({
            success: true,
            data: user,
            message: "Current user fetched successfully",
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @async
 * @function updateCurrentUser
 * @description Updates non-sensitive user metadata (fullName, profilePhotoUrl, etc.).
 * Validates that at least one updateable field is provided.
 * @param {AuthenticatedRequest} req - Request containing update payload in body.
 * @param {Response} res - Success response confirming update.
 * @param {NextFunction} next - Error propagation.
 * @returns {Promise<void>}
 */
export const updateCurrentUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { fullName, profilePhotoUrl, email } = req.body as Partial<{ fullName: string; profilePhotoUrl: string; email: string; }>;
        if (![fullName, profilePhotoUrl, email].some((field) => field?.trim())) throw new BadRequestError("Nothing to update");

        const updatedData: any = {};
        if (fullName?.trim()) updatedData.fullName = fullName.trim();
        if (profilePhotoUrl?.trim()) updatedData.profilePhotoUrl = profilePhotoUrl.trim();
        if (email?.trim() && email.trim() !== req.user?.email) {
            updatedData.email = email.trim();
            updatedData.isEmailVerified = false;
            updatedData.emailVerificationExpiry = null;
        }

        const updatedUser = await prisma.user.update({
            where: { id: req.user?.id as string },
            data: updatedData,
            select: { id: true, email: true, fullName: true, accountType: true, profilePhotoUrl: true },
        });

        res.status(200).json({ success: true, data: { user: updatedUser }, message: "User updated successfully" });
    } catch (error) {
        next(error);
    }
};

/**
 * @async
 * @function deleteCurrentUser
 * @description Permanently deletes the authenticated user's account and all associated data.
 * Leverages Prisma's Cascade delete to clean up related ledger entries, memberships, and submissions.
 * @param {AuthenticatedRequest} req - Request containing the user's ID via the auth token.
 * @param {Response} res - Success response confirming deletion.
 * @param {NextFunction} next - Error propagation.
 * @returns {Promise<void>}
 */
export const deleteCurrentUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.id as string;
        if (!userId) throw new BadRequestError("Unable to resolve user identity for deletion.");

        await prisma.user.delete({ where: { id: userId } });

        res.status(200).json({
            success: true,
            message: "Account deleted successfully.",
        });
    } catch (error: any) {
        if (error.code === "P2025") return next(new BadRequestError("Account no longer exists."));
        next(error);
    }
};

/**
 * @async
 * @function uploadProfilePhoto
 * @description Processes a multipart image upload, transfers it to the 'profiles/'
 * folder in MinIO, and updates the user's profilePhotoUrl reference in the database.
 * @param {AuthenticatedRequest} req - Expects req.file (Multer).
 * @returns {Promise<void>}
 */
export const uploadProfilePhoto = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        if (!req.file) throw new BadRequestError("No image file provided.");
        const userId = req.user?.id as string;

        const fileName = await uploadBuffer(req.file.buffer, req.file.originalname, req.file.mimetype, "profiles/");

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { profilePhotoUrl: fileName },
            select: { id: true, profilePhotoUrl: true },
        });

        res.status(200).json({ success: true, data: updatedUser, message: "Profile photo updated successfully." });
    } catch (error) {
        next(error);
    }
};

/**
 * @async
 * @function uploadQualificationProof
 * @description Handles Tutor-specific document uploads. Creates a new TutorApplication
 * record and updates the User's global RBAC status back to PENDING.
 * Enforces a 48-hour cooldown period if the previous application was rejected.
 * @param {AuthenticatedRequest} req - Expects req.file (Multer).
 * @returns {Promise<void>}
 */
export const uploadQualificationProof = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        if (!req.file) throw new BadRequestError("No document provided.");
        const userId = req.user?.id as string;

        // Fetch the MOST RECENT application
        const latestApplication = await prisma.tutorApplication.findFirst({
            where: { userId },
            orderBy: { createdAt: "desc" },
        });

        if (latestApplication) {
            if (latestApplication.status === "PENDING") throw new ConflictError("You already have a pending application under review.");
            if (latestApplication.status === "VERIFIED") throw new ConflictError("Your account is already verified.");
            
            if (latestApplication.status === "REJECTED") {
                const unlockTime = dayjs(latestApplication.updatedAt).add(48, "hour");
                const now = dayjs();

                if (now.isBefore(unlockTime)) {
                    const hoursLeft = unlockTime.diff(now, "hour");
                    throw new ConflictError(`Your previous application was rejected. Please reorganize your documents and try again in ${hoursLeft} hours.`);
                }
            }
        }

        const fileName = await uploadBuffer(req.file.buffer, req.file.originalname, req.file.mimetype, "qualifications/");

        // Create the new ledger entry
        await prisma.tutorApplication.create({
            data: { userId, documentUrl: fileName, status: "PENDING" }
        });

        res.status(200).json({
            success: true,
            message: "Qualification proof uploaded and is now under review.",
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @async
 * @function changePassword
 * @description Securely updates the user password. Verifies the existing (old)
 * password before hashing and persisting the new password.
 * @returns {Promise<void>}
 */
export const changePassword = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { oldPassword, newPassword } = req.body;
        if (!oldPassword?.trim() || !newPassword?.trim()) throw new BadRequestError("Old password and new password are required");
        if (oldPassword === newPassword) throw new BadRequestError("New password cannot be the same as the old password");

        const user = await prisma.user.findUnique({ where: { id: req.user?.id as string } });
        const isPasswordCorrect = await bcrypt.compare(oldPassword, user?.password as string);
        if (!isPasswordCorrect) throw new BadRequestError("Old password is incorrect");

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: req.user?.id as string },
            data: { password: hashedNewPassword },
        });
        res.status(200).json({ success: true, message: "Password changed successfully" });
    } catch (error) {
        next(error);
    }
};

/**
 * @async
 * @function sendOtp
 * @description Generates a 6-digit numeric OTP, hashes it, and dispatches it via email.
 * Accepts a 'purpose' payload to contextualize the request (e.g., EMAIL_VERIFICATION, CHANGE_PASSWORD).
 * @returns {Promise<void>}
 */
export const sendOtp = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { purpose } = req.body as { purpose: string };
        if (!purpose?.trim()) throw new BadRequestError("OTP purpose is required.");

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        await prisma.user.update({
            where: { id: req.user?.id as string },
            data: {
                verificationOtp: await bcrypt.hash(otp, 10),
                verificationOtpExpiry: dayjs().add(15, "minute").toDate(),
            },
        });

        await sendOTP({ name: req.user?.fullName as string, email: req.user?.email as string }, otp);
        
        res.status(200).json({ 
            success: true, 
            message: `OTP sent successfully for ${purpose.replace("_", " ")}` 
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @async
 * @function verifyOtp
 * @description A centralized action dispatcher. Validates the OTP and, if successful,
 * executes the database updates corresponding to the 'purpose'.
 */
export const verifyOtp = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { otp, purpose, payload } = req.body;
        if (!otp?.trim() || !purpose?.trim()) throw new BadRequestError("OTP and purpose are required.");

        const user = await prisma.user.findUnique({ where: { id: req.user?.id as string } });
        
        if (!user?.verificationOtp || !user?.verificationOtpExpiry || dayjs().isAfter(user.verificationOtpExpiry)) {
            throw new BadRequestError("OTP has expired. Please request a new one.");
        }

        const isOtpCorrect = await bcrypt.compare(otp, user.verificationOtp);
        if (!isOtpCorrect) throw new BadRequestError("Invalid OTP.");

        const updateData: any = {
            verificationOtp: null,
            verificationOtpExpiry: null,
        };

        let successMessage = "Action completed successfully.";

        switch (purpose) {
            case "EMAIL_VERIFICATION":
                updateData.isEmailVerified = true;
                updateData.emailVerificationExpiry = dayjs().add(12, "month").toDate();
                successMessage = "Email verified successfully.";
                break;
                
            case "CHANGE_PASSWORD":
                if (!payload?.newPassword || !payload?.oldPassword) {
                    throw new BadRequestError("Both old and new passwords are required.");
                }
                if (payload.oldPassword === payload.newPassword) {
                    throw new BadRequestError("New password cannot be the same as the old password.");
                }
                const isOldCorrect = await bcrypt.compare(payload.oldPassword, user.password);
                if (!isOldCorrect) {
                    throw new ForbiddenError("Old password is incorrect.");
                }
                updateData.password = await bcrypt.hash(payload.newPassword, 10);
                successMessage = "Password changed securely.";
                break;

            default:
                throw new BadRequestError("Unrecognized action purpose.");
        }

        // Execute the atomic update
        await prisma.user.update({
            where: { id: req.user?.id as string },
            data: updateData,
        });

        res.status(200).json({ success: true, message: successMessage });
    } catch (error) {
        next(error);
    }
};