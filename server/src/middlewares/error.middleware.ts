/**
 * @file error.middleware.ts
 * @module Middlewares/ErrorHandler
 * @description Centralized error processing unit. Intercepts all application errors,
 * cleanses them of sensitive information based on environment, and returns a 
 * standard JSON response.
 */
import type { Request, Response, NextFunction } from 'express';
import { ENV_CONFIG } from '../configs/env.config.ts';
import Logger from '../utils/Logger.ts';

/**
 * @function globalErrorHandler
 * @description Catch-all middleware for error handling. 
 * Specialized handling for Prisma-specific errors (P2002, P2025) is included.
 * @param {any} err - The error object passed via next(err).
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 * @param {NextFunction} next - The Express next function.
 */
export const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction): void => {
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';
    
    /** Handle Prisma Unique Constraint Violation */
    if(err.code === "P2002") {
        statusCode = 409;
        message = `Unique constraint failed on the field: ${err.meta.target}`;
    }
    /** Handle Prisma Resource Not Found */
    else if(err.code === "P2025") {
        statusCode = 404;
        message = `Record not found: ${err.meta.cause}`;
    }

    /** Construct Standardized Error Response */
    const responseBody: any = {
        success: false,
        status: statusCode,
        message: message,
        /** Stack trace and internals are exposed only in development mode */
        ...(ENV_CONFIG.NODE_ENV === 'development' && {
            stack: err.stack,
            errorName: err.name,
            errorCode: err.code
        }),
    };

    /** Server-side logging */
    if(ENV_CONFIG.NODE_ENV === "development") {
        Logger.error(req.method + ' ' + req.path + ' >> ' + err);
    } else if (statusCode === 500) {
        Logger.error(req.method + ' ' + req.path + ' >> ' + err.message);
    }

    res.status(statusCode).json(responseBody);
};