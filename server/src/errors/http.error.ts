/**
 * @file http.error.ts
 * @module Errors/Base
 * @description The base HTTP error class. All specialized API errors extend this class
 * to ensure consistency in status codes and operational flagging.
 * @author Sayan Chandra
 */

/**
 * @class HttpError
 * @extends Error
 * @description Custom error class to handle HTTP-specific exceptions.
 * It adds a status code and an 'isOperational' flag to distinguish between
 * trusted (operational) errors and programming bugs.
 */
export default class HttpError extends Error {
    /** 
     * @property {number} statusCode - The HTTP status code associated with this error (e.g., 404, 500).
     */
    public statusCode: number;

    /** 
     * @property {boolean} isOperational - Indicates if the error is expected (operational) or a crash (non-operational).
     * Useful for the global error handler logic.
     */
    public isOperational: boolean;

    /**
     * @constructor
     * @param {string} message - The human-readable error message.
     * @param {number} statusCode - The HTTP status code.
     */
    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;

        /**
         * Capture the stack trace while excluding the constructor call from it.
         */
        Error.captureStackTrace(this, this.constructor);
    }
}