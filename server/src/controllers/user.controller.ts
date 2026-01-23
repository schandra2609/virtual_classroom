import type { NextFunction, Response } from "express";
import bcrypt from "bcrypt";
import { BadRequestError, ForbiddenError } from "../errors/handler.error.ts";
import { prisma } from "../configs/database.config.ts";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.ts";
import { dayjs } from "../configs/dayjs.config.ts";

export const getCurrentUser = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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

export const updateCurrentUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { fullName, profilePhotoUrl, email } = req.body as Partial<{ fullName: string, profilePhotoUrl: string, email: string }>;
        if(![fullName, profilePhotoUrl, email].some((field) => field?.trim())) {
            throw new BadRequestError("Nothing to update");
        }

        const updatedData: any = {};
        if(fullName?.trim()) updatedData.fullName = fullName.trim();
        if(profilePhotoUrl?.trim()) updatedData.profilePhotoUrl = profilePhotoUrl.trim();

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

export const changePassword = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { oldPassword, newPassword } = req.body;
        if(!oldPassword?.trim() || !newPassword?.trim()) {
            throw new BadRequestError("Old password and new password are required");
        }
        if(oldPassword === newPassword) {
            throw new BadRequestError("New password cannot be the same as the old password");
        }

        const user = await prisma.user.findUnique({
            where: { id: req.user?.id as string },
        });
        const isPasswordCorrect = await bcrypt.compare(oldPassword, user?.password as string);
        if(!isPasswordCorrect) {
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

export const sendVerificationOtp = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        await prisma.user.update({
            where: { id: req.user?.id as string },
            data: {
                verificationOtp: await bcrypt.hash(otp, 10),
                verificationOtpExpiry: dayjs().add(15, 'minute').toDate(),
            },
        });

        // TODO: send OTP via email service (to be implemented)

        res.status(200).json({
            success: true,
            message: `Verification OTP sent to your ${req.user?.email}`,
        });
    } catch (error) {
        next(error);
    }
};

export const verifyEmail = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { otp } = req.body;
        if(!otp?.trim()) {
            throw new BadRequestError("OTP is required");
        }

        const user = await prisma.user.findUnique({
            where: { id: req.user?.id as string },
        });
        if(!user?.verificationOtp || !user?.verificationOtpExpiry || dayjs().isAfter(user.verificationOtpExpiry)) {
            throw new BadRequestError("OTP has expired. Please request a new one");
        }

        const isOtpCorrect = await bcrypt.compare(otp, user.verificationOtp);
        if(!isOtpCorrect) {
            throw new BadRequestError("Invalid OTP");
        }
        
        await prisma.user.update({
            where: { id: req.user?.id as string },
            data: {
                isEmailVerified: true,
                emailVerificationExpiry: dayjs().add(12, 'month').toDate(),
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

export const submitQualification = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { qualificationUrl } = req.body;
        if(!qualificationUrl?.trim()) {
            throw new BadRequestError("Qualification URL is required");
        }

        const user = await prisma.user.findUnique({
            where: { id: req.user?.id as string },
        });
        if(user?.tutorVerificationStatus === "REJECTED") {
            const twoMonthsAgo = dayjs().subtract(2, 'months');
            const lastRejectionDate = dayjs(user.tutorStatusUpdatedAt);
            if(lastRejectionDate.isAfter(twoMonthsAgo)) {
                throw new ForbiddenError(`You can't apply till ${lastRejectionDate.add(2, 'months').format('DD MM YYYY')}`);
            }
        }

        await prisma.user.update({
            where: { id: req.user?.id as string },
            data: {
                tutorQualificationUrl: qualificationUrl.trim(),
                tutorVerificationStatus: "PENDING",
                tutorStatusUpdatedAt: new Date(),
            },
        });

        res.status(200).json({
            success: true,
            message: "Qualification submitted successfully. Your application is under review.",
        });
    } catch (error) {
        next(error);
    }
};