import type { Request, Response, NextFunction } from 'express';
import { ENV_CONFIG } from '../configs/env.config.ts';
import Logger from '../utils/Logger.ts';

export const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction): void => {
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';
    
    if(err.code === "P2002") {
        statusCode = 409;
        message = `Unique constraint failed on the field: ${err.meta.target}`;
    } else if(err.code === "P2025") {
        statusCode = 404;
        message = `Record not found: ${err.meta.cause}`;
    }

    const responseBody: any = {
        success: false,
        status: statusCode,
        message: message,
        ...err(ENV_CONFIG.NODE_ENV === 'development' && {
            stack: err.stack,
            errorName: err.name,
            errorCode: err.code
        }),
    };

    if(ENV_CONFIG.NODE_ENV === "development") {
        Logger.error(req.method + ' ' + req.path + ' >> ' + err);
    } else if (statusCode === 500) {
        Logger.error(req.method + ' ' + req.path + ' >> ' + err.message);
    }

    res.status(statusCode).json(responseBody);
};