/**
 * @file auth.controller.ts
 * @module Controllers/Authentication
 * @description Business logic for user authentication. Implements a secure
 * dual-token system: short-lived Access Tokens for API calls and long-lived
 * Refresh Tokens (stored in HttpOnly cookies) for session persistence.
 */
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
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from "../errors/handler.error.ts";
import Helper from "../utils/Helper.ts";
import { sendWelcomeEmail } from "../services/email.service.ts";

/**
 * @async
 * @function generateTokens
 * @private
 * @description Internal utility to generate a JWT pair and persist the refresh token in the DB.
 * @param {Partial<User>} user - The user object containing id, email, and accountType.
 * @returns {Promise<{accessToken: string, refreshToken: string}>}
 * @throws {BadRequestError} If user ID is missing.
 */
const generateTokens = async (
  user: Partial<User>,
): Promise<{ accessToken: string; refreshToken: string }> => {
  if (!user.id) {
    throw new BadRequestError("User ID is required to generate tokens");
  }

  const accessToken: string = jwt.sign(
    { id: user.id, email: user.email, accountType: user.accountType },
    ENV_CONFIG.ACCESS_TOKEN.SECRET as string,
    { expiresIn: ENV_CONFIG.ACCESS_TOKEN.LIFETIME as any },
  );

  const refreshToken: string = jwt.sign(
    { id: user.id, email: user.email, accountType: user.accountType },
    ENV_CONFIG.REFRESH_TOKEN.SECRET as string,
    { expiresIn: ENV_CONFIG.REFRESH_TOKEN.LIFETIME as any },
  );

  await prisma.user.update({
    where: { id: user.id as string },
    data: { refreshToken: refreshToken },
  });

  return { accessToken, refreshToken };
};

/**
 * @async
 * @function register
 * @description Creates a new user account (STUDENT or TUTOR).
 * Validates email uniqueness and password strength before hashing.
 * @returns {Promise<void>}
 */
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { fullName, email, password, accountType } = req.body as {
      fullName: string;
      email: string;
      password: string;
      accountType: any;
    };
    if (
      ![fullName, email, password, accountType].every((field) => field.trim())
    ) {
      throw new BadRequestError(
        "Full name, email, password and account type are required",
      );
    }
    if (!["STUDENT", "TUTOR"].includes(accountType)) {
      throw new BadRequestError("Invalid account type");
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (existingUser) {
      throw new ConflictError("Email is already registered");
    }
    if (!Helper.isPasswordStrong(password)) {
      throw new BadRequestError("Password is not strong enough");
    }

    const hashedPassword: string = await bcrypt.hash(password, 10);
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

    // Send Welcome Email
    const dashboardUrl = `${ENV_CONFIG.CORS_ORIGIN[0]}/dashboard/${accountType.toLowerCase()}`;
    await sendWelcomeEmail({ name: fullName, email: email }, dashboardUrl);
  } catch (error) {
    next(error);
  }
};

/**
 * @async
 * @function login
 * @description Authenticates user via email/password.
 * Sets the Refresh Token in a 'strict' HttpOnly cookie for security.
 * @returns {Promise<void>}
 */
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { email, password } = req.body as { email: string; password: string };
    if (![email, password].every((field) => field.trim())) {
      throw new BadRequestError("Email and password are required");
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (!user) {
      throw new NotFoundError("User not found for this email");
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password as string,
    );
    if (!isPasswordCorrect) {
      throw new UnauthorizedError("Invalid credentials.");
    }

    const { accessToken, refreshToken } = (await generateTokens(user)) as {
      accessToken: string;
      refreshToken: string;
    };
    const cookieOptions = {
      httpOnly: true as boolean,
      secure: (ENV_CONFIG.NODE_ENV === "production") as boolean,
      sameSite: "lax" as const,
    };

    const { password: _, refreshToken: __, ...userWithoutSecrets } = user;
    res
      .status(200)
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

/**
 * @async
 * @function logout
 * @description Invalidate refresh token in database and clear client-side cookies.
 * @returns {Promise<void>}
 */
export const logout = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    await prisma.user.update({
      where: { id: req.user?.id as string },
      data: { refreshToken: null },
    });

    res.status(200).clearCookie("refreshToken").json({
      success: true,
      message: "User logged out successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @async
 * @function handleGoogleCallback
 * @description Logic for the Google OAuth redirect.
 * If user exists: Logs them in immediately.
 * If user is new: Redirects to profile completion with a temporary setup token.
 * @returns {Promise<void>}
 */
export const handleGoogleCallback = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const googleProfile = req.user as any;
    const email = googleProfile.emails[0].value as string;

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (existingUser) {
      const { accessToken, refreshToken } = await generateTokens(existingUser);
      const cookieOptions = {
        httpOnly: true,
        secure: (ENV_CONFIG.NODE_ENV === "production") as boolean,
        sameSite: "lax" as const,
      };

      res
        .cookie("refreshToken", refreshToken, cookieOptions)
        .redirect(
          `${ENV_CONFIG.CORS_ORIGIN[0]}/auth/callback?token=${accessToken}`,
        );
      return;
    }

    // New user path: sign a short-lived token to protect the profile completion route
    const setUpPayload = { email: email, fullName: googleProfile.displayName };
    const setupToken = jwt.sign(
      setUpPayload,
      ENV_CONFIG.REFRESH_TOKEN.SECRET as string,
      { expiresIn: "15m" },
    );

    res.redirect(
      `${ENV_CONFIG.CORS_ORIGIN[0]}/auth/complete-profile?setupToken=${setupToken}`,
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @async
 * @function refreshAccessTokens
 * @description Validates the Refresh Token from cookies and issues a new Access Token.
 * Implements 'Refresh Token Rotation' logic by updating the token in the DB.
 * @returns {Promise<void>}
 */
export const refreshAccessTokens = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const incomingRefreshToken: string = req.cookies?.refreshToken;
    if (!incomingRefreshToken.trim()) {
      throw new UnauthorizedError("No refresh token provided.");
    }

    const decoded = jwt.verify(
      incomingRefreshToken,
      ENV_CONFIG.REFRESH_TOKEN.SECRET,
    ) as JwtPayload;
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user || user.refreshToken !== incomingRefreshToken) {
      throw new UnauthorizedError("Invalid or expired refresh token.");
    }

    const { accessToken, refreshToken } = (await generateTokens(user)) as {
      accessToken: string;
      refreshToken: string;
    };
    const cookieOptions = {
      httpOnly: true,
      secure: (ENV_CONFIG.NODE_ENV === "production") as boolean,
      sameSite: "lax" as const,
    };

    res
      .status(200)
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

/**
 * @async
 * @function completeUserProfile
 * @description Finalizes registration for OAuth users by allowing them to select
 * their AccountType (STUDENT/TUTOR) and providing necessary credentials.
 * @returns {Promise<void>}
 */
export const completeUserProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { setupToken, accountType, qualificationUrl } = req.body as {
      setupToken: string;
      accountType: any;
      qualificationUrl: string;
    };
    if (
      ![setupToken, accountType, qualificationUrl].every((field) =>
        field.trim(),
      )
    ) {
      throw new BadRequestError(
        "Setup token, account type, qualification URL are required.",
      );
    }

    const decoded = jwt.verify(
      setupToken,
      ENV_CONFIG.REFRESH_TOKEN.SECRET,
    ) as JwtPayload;
    const user = await prisma.user.create({
      data: {
        email: decoded.email as string,
        fullName: decoded.fullName as string,
        password: await bcrypt.hash(randomBytes(20).toString("hex"), 10), // Random password for OAuth users
        accountType: accountType,
        isEmailVerified: true,
        emailVerificationExpiry: dayjs().add(12, "month").toDate(),
        tutorQualificationUrl:
          accountType === "TUTOR" ? qualificationUrl : null,
      },
    });
    const { accessToken, refreshToken } = (await generateTokens(user)) as {
      accessToken: string;
      refreshToken: string;
    };
    const cookieOptions = {
      httpOnly: true,
      secure: (ENV_CONFIG.NODE_ENV === "production") as boolean,
      sameSite: "lax" as const,
    };
    const { password: _, refreshToken: __, ...userWithoutSecrets } = user;
    res
      .status(201)
      .cookie("refreshToken", refreshToken, cookieOptions)
      .json({
        success: true,
        data: { user: userWithoutSecrets, accessToken: accessToken },
        message: "User profile completed and logged in successfully",
      });

    // Send Welcome Email
    const dashboardUrl = `${ENV_CONFIG.CORS_ORIGIN[0]}/dashboard/${accountType.toLowerCase()}`;
    await sendWelcomeEmail(
      { name: decoded.fullName, email: decoded.email },
      dashboardUrl,
    );
  } catch (error) {
    next(error);
  }
};
