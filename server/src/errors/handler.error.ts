/**
 * @file handler.error.ts
 * @module Errors/Handlers
 * @description A collection of specialized error classes for standard HTTP scenarios.
 * These are used throughout the controllers and middlewares to trigger specific status codes.
 */
import HttpError from "./http.error.ts";

/**
 * @class BadRequestError
 * @extends HttpError
 * @description 400 Bad Request - The server cannot process the request due to client error (e.g., malformed syntax).
 */
export class BadRequestError extends HttpError {
    constructor(message: string = "Bad Request") {
        super(message, 400);
    }
}

/**
 * @class UnauthorizedError
 * @extends HttpError
 * @description 401 Unauthorized - The request requires user authentication (e.g., missing or invalid JWT).
 */
export class UnauthorizedError extends HttpError {
    constructor(message: string = "Unauthorized") {
        super(message, 401);
    }
}

/**
 * @class ForbiddenError
 * @extends HttpError
 * @description 403 Forbidden - The user is authenticated but does not have permission for the requested resource.
 */
export class ForbiddenError extends HttpError {
    constructor(message: string = "Forbidden") {
        super(message, 403);
    }
}

/**
 * @class NotFoundError
 * @extends HttpError
 * @description 404 Not Found - The requested resource could not be found on the server.
 */
export class NotFoundError extends HttpError {
    constructor(message: string = "Not Found") {
        super(message, 404);
    }
}

/**
 * @class MethodNotAllowedError
 * @extends HttpError
 * @description 405 Method Not Allowed - The request method is known by the server but has been disabled for the resource.
 */
export class MethodNotAllowedError extends HttpError {
    constructor(message: string = "Method Not Allowed") {
        super(message, 405);
    }
}

/**
 * @class ConflictError
 * @extends HttpError
 * @description 409 Conflict - The request could not be completed due to a conflict with the current state of the resource (e.g., duplicate unique field).
 */
export class ConflictError extends HttpError {
    constructor(message: string = "Conflict") {
        super(message, 409);
    }
}

/**
 * @class PayloadTooLargeError
 * @extends HttpError
 * @description 413 Payload Too Large - The request entity is larger than limits defined by server (e.g., file upload size).
 */
export class PayloadTooLargeError extends HttpError {
    constructor(message: string = "Payload Too Large") {
        super(message, 413);
    }
}

/**
 * @class UnsupportedMediaTypeError
 * @extends HttpError
 * @description 415 Unsupported Media Type - The server refuses to accept the request because the payload format is in an unsupported format.
 */
export class UnsupportedMediaTypeError extends HttpError {
    constructor(message: string = "Unsupported Media Type") {
        super(message, 415);
    }
}

/**
 * @class UnprocessableEntityError
 * @extends HttpError
 * @description 422 Unprocessable Entity - The request was well-formed but was unable to be followed due to semantic errors (e.g., validation logic).
 */
export class UnprocessableEntityError extends HttpError {
    constructor(message: string = "Unprocessable Entity") {
        super(message, 422);
    }
}

/**
 * @class TooManyRequestsError
 * @extends HttpError
 * @description 429 Too Many Requests - The user has sent too many requests in a given amount of time (Rate Limiting).
 */
export class TooManyRequestsError extends HttpError {
    constructor(message: string = "Too Many Requests") {
        super(message, 429);
    }
}

/**
 * @class InternalServerError
 * @extends HttpError
 * @description 500 Internal Server Error - A generic error message given when an unexpected condition was encountered.
 */
export class InternalServerError extends HttpError {
    constructor(message: string = "Internal Server Error") {
        super(message, 500);
    }
}

/**
 * @class ServiceUnavailableError
 * @extends HttpError
 * @description 503 Service Unavailable - The server is currently unable to handle the request (e.g., DB down, Maintenance).
 */
export class NotImplementedError extends HttpError {
    constructor(message: string = "Not Implemented") {
        super(message, 501);
    }
}

/**
 * @class BadGatewayError
 * @extends HttpError
 * @description 502 Bad Gateway - The server, while acting as a gateway or proxy, 
 * received an invalid response from an upstream server.
 */
export class BadGatewayError extends HttpError {
    constructor(message: string = "Bad Gateway") {
        super(message, 502);
    }
}

/**
 * @class ServiceUnavailableError
 * @extends HttpError
 * @description 503 Service Unavailable - The server is currently unable to handle the request (e.g., DB down, Maintenance).
 */
export class ServiceUnavailableError extends HttpError {
    constructor(message: string = "Service Unavailable") {
        super(message, 503);
    }
}

/**
 * @class GatewayTimeoutError
 * @extends HttpError
 * @description 504 Gateway Timeout - The server, while acting as a gateway or proxy, 
 * did not receive a timely response from an upstream server.
 */
export class GatewayTimeoutError extends HttpError {
    constructor(message: string = "Gateway Timeout") {
        super(message, 504);
    }
}