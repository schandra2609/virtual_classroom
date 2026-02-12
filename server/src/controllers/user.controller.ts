/**
 * @file user.controller.ts
 * @module Controllers/User
 * @description Controller logic for managing the authenticated user's profile,
 * security settings (passwords, OTPs), and document uploads.
 * @author Sayan Chandra
 */
import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.ts";
import bcrypt from "bcrypt";
import { BadRequestError } from "../errors/handler.error.ts";
import { prisma } from "../configs/database.config.ts";
import { dayjs } from "../configs/dayjs.config.ts";
import { uploadBuffer } from "../services/storage.service.ts";
import { sendOTP } from "../services/email.service.ts";

/**
 * @function getCurrentUser
 * @description Retrieves the full profile of the currently authenticated user from the request context.
 * @param {AuthenticatedRequest} req - The request object populated by verifyToken middleware.
 * @param {Response} res - Express response object.
 * @param {NextFunction} next - Error propagation function.
 * @returns {void}
 */
export const getCurrentUser = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
        res.status(200).json({
            success: true,
            data: {
                user: req.user,
            },
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
 * @returns {Promise<void>}
 */
export const updateCurrentUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { fullName, profilePhotoUrl, email } = req.body as Partial<{
            fullName: string;
            profilePhotoUrl: string;
            email: string;
        }>;
        if (![fullName, profilePhotoUrl, email].some((field) => field?.trim())) {
            throw new BadRequestError("Nothing to update");
        }

        const updatedData: any = {};
        if (fullName?.trim())
            updatedData.fullName = fullName.trim();
        if (profilePhotoUrl?.trim())
            updatedData.profilePhotoUrl = profilePhotoUrl.trim();
        if (email?.trim() && email.trim() !== req.user?.email) {
            updatedData.email = email.trim();
            updatedData.isEmailVerified = false;
            updatedData.emailVerificationExpiry = null;
        }

        const updatedUser = await prisma.user.update({
            where: { id: req.user?.id as string },
            data: updatedData,
            select: {
                id: true,
                email: true,
                fullName: true,
                accountType: true,
                profilePhotoUrl: true,
            },
        });
        res.status(200).json({
            success: true,
            data: {
                user: updatedUser,
            },
            message: "User updated successfully",
        });
    } catch (error) {
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

        // Upload buffer to MinIO service
        const fileName = await uploadBuffer(
            req.file.buffer,
            req.file.originalname,
            req.file.mimetype,
            "profiles/",
        );

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { profilePhotoUrl: fileName },
            select: { id: true, profilePhotoUrl: true },
        });

        res.status(200).json({
            success: true,
            data: updatedUser,
            message: "Profile photo updated successfully.",
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @async
 * @function uploadQualificationProof
 * @description Handles Tutor-specific document uploads (e.g., certificates).
 * Uploads the file and sets the verification status to 'PENDING' for administrative review.
 * @param {AuthenticatedRequest} req - Expects req.file (Multer).
 * @returns {Promise<void>}
 */
export const uploadQualificationProof = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        if (!req.file) throw new BadRequestError("No document provided.");

        const fileName = await uploadBuffer(
            req.file.buffer,
            req.file.originalname,
            req.file.mimetype,
            "qualifications/",
        );

        await prisma.user.update({
            where: { id: req.user?.id as string },
            data: {
                tutorQualificationUrl: fileName,
                tutorVerificationStatus: "PENDING",
                tutorStatusUpdatedAt: new Date(),
            },
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
        if (!oldPassword?.trim() || !newPassword?.trim()) {
            throw new BadRequestError("Old password and new password are required");
        }
        if (oldPassword === newPassword) {
            throw new BadRequestError("New password cannot be the same as the old password");
        }

        const user = await prisma.user.findUnique({
            where: { id: req.user?.id as string },
        });
        const isPasswordCorrect = await bcrypt.compare(oldPassword, user?.password as string);
        if (!isPasswordCorrect) {
            throw new BadRequestError("Old password is incorrect");
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: req.user?.id as string },
            data: { password: hashedNewPassword },
        });
        res.status(200).json({
            success: true,
            message: "Password changed successfully",
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @async
 * @function sendVerificationOtp
 * @description Generates a 6-digit numeric OTP, hashes it for secure storage,
 * and sets a 15-minute expiration window.
 * @returns {Promise<void>}
 */
export const sendVerificationOtp = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        await prisma.user.update({
            where: { id: req.user?.id as string },
            data: {
                verificationOtp: await bcrypt.hash(otp, 10),
                verificationOtpExpiry: dayjs().add(15, "minute").toDate(),
            },
        });

        /**
         * Integration Point: Dispatch email with the raw 'otp' code
         */
        await sendOTP(
            {
                name: req.user?.fullName as string,
                email: req.user?.email as string,
            },
            otp,
        );

        res.status(200).json({
            success: true,
            message: `Verification OTP sent to your ${req.user?.email}`,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @async
 * @function verifyEmail
 * @description Validates a submitted OTP. If valid and not expired, sets
 * the user as verified and grants a 12-month verification lifespan.
 */
export const verifyEmail = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { otp } = req.body;
        if (!otp?.trim()) {
            throw new BadRequestError("OTP is required");
        }

        const user = await prisma.user.findUnique({
            where: { id: req.user?.id as string },
        });
        if (
            !user?.verificationOtp ||
            !user?.verificationOtpExpiry ||
            dayjs().isAfter(user.verificationOtpExpiry)
        ) {
            throw new BadRequestError("OTP has expired. Please request a new one");
        }

        const isOtpCorrect = await bcrypt.compare(otp, user.verificationOtp);
        if (!isOtpCorrect) {
            throw new BadRequestError("Invalid OTP");
        }

        await prisma.user.update({
            where: { id: req.user?.id as string },
            data: {
                isEmailVerified: true,
                emailVerificationExpiry: dayjs().add(12, "month").toDate(),
                verificationOtp: null,
                verificationOtpExpiry: null,
            },
        });

        res.status(200).json({
            success: true,
            message: "Email verified successfully",
        });
    } catch (error) {
        next(error);
    }
};