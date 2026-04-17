/**
 * @file Error.ts
 * @module Utils/Error
 * @description Centralized error classes for the application. Contains the base 
 * HttpError class and all specialized API errors to ensure consistency in 
 * status codes and operational flagging.
 * @author Sayan Chandra
 */

/**
 * @class HttpError
 * @extends Error
 * @description Custom error class to handle HTTP-specific exceptions.
 * It adds a status code and an 'isOperational' flag to distinguish between
 * trusted (operational) errors and programming bugs.
 */
export class HttpError extends Error {
    public statusCode: number;
    public isOperational: boolean;

    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * @class BadRequestError
 * @description 400 Bad Request - The server cannot process the request due to client error.
 */
export class BadRequestError extends HttpError {
    constructor(message: string = "Bad Request") {
        super(message, 400);
    }
}

/**
 * @class UnauthorizedError
 * @description 401 Unauthorized - The request requires user authentication.
 */
export class UnauthorizedError extends HttpError {
    constructor(message: string = "Unauthorized") {
        super(message, 401);
    }
}

/**
 * @class ForbiddenError
 * @description 403 Forbidden - The user is authenticated but lacks permission.
 */
export class ForbiddenError extends HttpError {
    constructor(message: string = "Forbidden") {
        super(message, 403);
    }
}

/**
 * @class NotFoundError
 * @description 404 Not Found - The requested resource could not be found.
 */
export class NotFoundError extends HttpError {
    constructor(message: string = "Not Found") {
        super(message, 404);
    }
}

/**
 * @class MethodNotAllowedError
 * @description 405 Method Not Allowed - The request method is known but disabled for the resource.
 */
export class MethodNotAllowedError extends HttpError {
    constructor(message: string = "Method Not Allowed") {
        super(message, 405);
    }
}

/**
 * @class ConflictError
 * @description 409 Conflict - Conflict with the current state of the resource (e.g., duplicate).
 */
export class ConflictError extends HttpError {
    constructor(message: string = "Conflict") {
        super(message, 409);
    }
}

/**
 * @class PayloadTooLargeError
 * @description 413 Payload Too Large - The request entity is larger than server limits.
 */
export class PayloadTooLargeError extends HttpError {
    constructor(message: string = "Payload Too Large") {
        super(message, 413);
    }
}

/**
 * @class UnsupportedMediaTypeError
 * @description 415 Unsupported Media Type - Payload format is in an unsupported format.
 */
export class UnsupportedMediaTypeError extends HttpError {
    constructor(message: string = "Unsupported Media Type") {
        super(message, 415);
    }
}

/**
 * @class UnprocessableEntityError
 * @description 422 Unprocessable Entity - Semantic errors in a well-formed request.
 */
export class UnprocessableEntityError extends HttpError {
    constructor(message: string = "Unprocessable Entity") {
        super(message, 422);
    }
}

/**
 * @class TooManyRequestsError
 * @description 429 Too Many Requests - Rate Limiting triggered.
 */
export class TooManyRequestsError extends HttpError {
    constructor(message: string = "Too Many Requests") {
        super(message, 429);
    }
}

/**
 * @class InternalServerError
 * @description 500 Internal Server Error - Unexpected server condition.
 */
export class InternalServerError extends HttpError {
    constructor(message: string = "Internal Server Error") {
        super(message, 500);
    }
}

/**
 * @class NotImplementedError
 * @description 501 Not Implemented - The server does not support the functionality required.
 */
export class NotImplementedError extends HttpError {
    constructor(message: string = "Not Implemented") {
        super(message, 501);
    }
}

/**
 * @class BadGatewayError
 * @description 502 Bad Gateway - Invalid response from an upstream server.
 */
export class BadGatewayError extends HttpError {
    constructor(message: string = "Bad Gateway") {
        super(message, 502);
    }
}

/**
 * @class ServiceUnavailableError
 * @description 503 Service Unavailable - Server is currently unable to handle the request.
 */
export class ServiceUnavailableError extends HttpError {
    constructor(message: string = "Service Unavailable") {
        super(message, 503);
    }
}

/**
 * @class GatewayTimeoutError
 * @description 504 Gateway Timeout - No timely response from an upstream server.
 */
export class GatewayTimeoutError extends HttpError {
    constructor(message: string = "Gateway Timeout") {
        super(message, 504);
    }
}