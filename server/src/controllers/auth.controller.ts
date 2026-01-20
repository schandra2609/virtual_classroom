import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";
import bcrypt from "bcrypt";
import { randomBytes } from "crypto";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.ts";
import type { User } from "../../generated/prisma/client.ts";
import { ENV_CONFIG } from "../configs/env.config.ts";
import { prisma } from "../configs/database.config.ts";
import { dayjs } from "../configs/dayjs.config.ts";
import { BadRequestError, ConflictError, NotFoundError, UnauthorizedError } from "../errors/handler.error.ts";
import Helper from "../utils/Helper.ts";

const generateTokens = async (user: Partial<User>) => {
    if (!user.id) {
        throw new BadRequestError("User ID is required to generate tokens");
    }

    const accessToken = jwt.sign(
        { id: user.id, email: user.email, accountType: user.accountType },
        ENV_CONFIG.ACCESS_TOKEN.SECRET as string,
        { expiresIn: ENV_CONFIG.ACCESS_TOKEN.LIFETIME as any },
    );

    const refreshToken = jwt.sign(
        { id: user.id, email: user.email, accountType: user.accountType },
        ENV_CONFIG.REFRESH_TOKEN.SECRET as string,
        { expiresIn: ENV_CONFIG.REFRESH_TOKEN.LIFETIME as any },
    );

    await prisma.user.update({
        where: { id: user.id as string },
        data: { refreshToken: refreshToken },
    });

    return { accessToken, refreshToken };
}


export const register = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { fullName, email, password, accountType } = req.body;
        if(![fullName, email, password, accountType].every(field => field.trim())) {
            throw new BadRequestError("Full name, email, password and account type are required");
        }
        if(!["STUDENT", "TUTOR"].includes(accountType)) {
            throw new BadRequestError("Invalid account type");
        }

        const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
        if(existingUser) {
            throw new ConflictError("Email is already registered");
        }
        if(!Helper.isPasswordStrong(password)) {
            throw new BadRequestError("Password is not strong enough");
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await prisma.user.create({
            data: {
                fullName: fullName.trim(),
                email: email.toLowerCase().trim(),
                password: hashedPassword,
                accountType: accountType,
            },
            select: {
                id: true,
                email: true,
                fullName: true,
                accountType: true,
                createdAt: true,
            },
        });

        res.status(201).json({
            success: true,
            data: newUser,
            message: "User registered successfully",
        });
    } catch (error) {
        next(error);
    }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;
        if(![email, password].every(field => field.trim())) {
            throw new BadRequestError("Email and password are required");
        }

        const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
        if(!user) {
            throw new NotFoundError("Invalid email or password");
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password as string);
        if(!isPasswordCorrect) {
            throw new UnauthorizedError("Invalid email or password");
        }

        const { accessToken, refreshToken } = await generateTokens(user);
        const cookieOptions = {
            httpOnly: true,
            secure: ENV_CONFIG.NODE_ENV === "production",
            sameSite: "strict" as const,
        }

        const { password: _, refreshToken: __, ...userWithoutSecrets } = user;
        res.status(200)
            .cookie("refreshToken", refreshToken, cookieOptions)
            .json({
                success: true,
                data: {
                    user: userWithoutSecrets,
                    accessToken: accessToken,
                },
                message: "User logged in successfully",
            });
    } catch (error) {
        next(error);
    }
};

export const logout = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if(!req.user?.id) {
            throw new BadRequestError("Not authenticated");
        }

        await prisma.user.update({
            where: { id: req.user.id },
            data: { refreshToken: null },
        });

        res.status(200)
            .clearCookie("refreshToken")
            .json({
                success: true,
                message: "User logged out successfully",
            });
    } catch (error) {
        next(error);
    }
};

export const handleGoogleCallback = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const googleProfile = req.user as any; 
        const email = googleProfile.emails[0].value;

        const existingUser = await prisma.user.findUnique({ where: { email: email } });
        if(existingUser) {
            const { accessToken, refreshToken } = await generateTokens(existingUser);
            const cookieOptions = {
                httpOnly: true,
                secure: ENV_CONFIG.NODE_ENV === "production",
                sameSite: "strict" as const,
            }

            res.cookie("refreshToken", refreshToken, cookieOptions)
                .redirect(`${ENV_CONFIG.CORS_ORIGIN[0]}/dashboard/${existingUser.accountType.toLowerCase()}`);
        }
        const setUpPayload = { email: email, fullName: googleProfile.displayName };
        const setupToken = jwt.sign(setUpPayload, ENV_CONFIG.REFRESH_TOKEN.SECRET as string, { expiresIn: '15m' });
        res.redirect(`${ENV_CONFIG.CORS_ORIGIN[0]}/auth/complete-profile?setupToken=${setupToken}`);
    } catch (error) {
        next(error);
    }
};

export const refreshAccessTokens = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const incomingRefreshToken = req.cookies?.refreshToken;
        if (!incomingRefreshToken?.trim()) {
            throw new UnauthorizedError("No refresh token provided");
        }

        const decoded = jwt.verify(incomingRefreshToken, ENV_CONFIG.REFRESH_TOKEN.SECRET) as JwtPayload;
        const user = await prisma.user.findUnique({ where: { id: decoded.id } });
        if (!user || user.refreshToken !== incomingRefreshToken) {
            throw new UnauthorizedError("Invalid or expired refresh token");
        }

        const { accessToken, refreshToken } = await generateTokens(user);
        const cookieOptions = {
            httpOnly: true,
            secure: ENV_CONFIG.NODE_ENV === "production",
            sameSite: "strict" as const,
        };

        res.status(200)
            .cookie("refreshToken", refreshToken, cookieOptions)
            .json({
                success: true,
                data: { accessToken: accessToken },
                message: "Access token refreshed",
            });
    } catch (error) {
        next(error);
    }
};

export const completeUserProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { setupToken, accountType, qualificationUrl } = req.body;
        if (!(setupToken?.trim() && accountType?.trim())) {
            throw new BadRequestError("Missing values: setup token, account type");
        }

        const decoded = jwt.verify(setupToken, ENV_CONFIG.REFRESH_TOKEN.SECRET) as JwtPayload;
        const user = await prisma.user.create({
            data: {
                email: decoded.email,
                fullName: decoded.fullName,
                password: await bcrypt.hash(randomBytes(20).toString('hex'), 10),
                accountType: accountType,
                isEmailVerified: true,
                emailVerificationExpiry: dayjs().add(12, 'month').toDate(),
                tutorQualificationUrl: accountType === "TUTOR" ? qualificationUrl : null,
            }
        });
        const { accessToken, refreshToken } = await generateTokens(user);
        const cookieOptions = {
            httpOnly: true,
            secure: ENV_CONFIG.NODE_ENV === "production",
            sameSite: "strict" as const,
        };
        const { password: _, refreshToken: __, ...userWithoutSecrets } = user;
        res.status(201)
            .cookie("refreshToken", refreshToken, cookieOptions)
            .json({
                success: true,
                data: { user: userWithoutSecrets, accessToken: accessToken },
                message: "User profile completed and logged in successfully",
            });
    } catch (error) {
        next(error);
    }
};