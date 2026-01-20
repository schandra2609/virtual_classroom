import HttpError from "./http.error.js";

export class BadRequestError extends HttpError {
    constructor(message: string = "Bad Request") {
        super(message, 400);
    }
}

export class UnauthenticatedError extends HttpError {
    constructor(message: string = "Unauthenticated") {
        super(message, 401);
    }
}

export class ForbiddenError extends HttpError {
    constructor(message: string = "Forbidden") {
        super(message, 403);
    }
}

export class NotFoundError extends HttpError {
    constructor(message: string = "Not Found") {
        super(message, 404);
    }
}

export class MethodNotAllowedError extends HttpError {
    constructor(message: string = "Method Not Allowed") {
        super(message, 405);
    }
}

export class ConflictError extends HttpError {
    constructor(message: string = "Conflict") {
        super(message, 409);
    }
}

export class PayloadTooLargeError extends HttpError {
    constructor(message: string = "Payload Too Large") {
        super(message, 413);
    }
}

export class UnsupportedMediaTypeError extends HttpError {
    constructor(message: string = "Unsupported Media Type") {
        super(message, 415);
    }
}

export class UnprocessableEntityError extends HttpError {
    constructor(message: string = "Unprocessable Entity") {
        super(message, 422);
    }
}

export class TooManyRequestsError extends HttpError {
    constructor(message: string = "Too Many Requests") {
        super(message, 429);
    }
}

export class InternalServerError extends HttpError {
    constructor(message: string = "Internal Server Error") {
        super(message, 500);
    }
}

export class NotImplementedError extends HttpError {
    constructor(message: string = "Not Implemented") {
        super(message, 501);
    }
}

export class BadGatewayError extends HttpError {
    constructor(message: string = "Bad Gateway") {
        super(message, 502);
    }
}

export class ServiceUnavailableError extends HttpError {
    constructor(message: string = "Service Unavailable") {
        super(message, 503);
    }
}

export class GatewayTimeoutError extends HttpError {
    constructor(message: string = "Gateway Timeout") {
        super(message, 504);
    }
}