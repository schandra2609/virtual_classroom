/**
 * @file Helper.ts
 * @module Utils/Helpers
 * @description Utility class containing static methods for string manipulation, 
 * validation, and common algorithm tasks used across the application.
 */

/**
 * @class Helper
 * @description - Facilitates with all necessary helper methods required in the server
 */
export default class Helper {
    /**
     * @method generateRandomCode
     * @description Generates an alphanumeric random string of a specified length.
     * Primarily used for classroom joining codes or temporary identifiers.
     * @param {number} length - The desired length of the string.
     * @returns {string} The generated random code.
     */
    static generateRandomCode = (length: number): string => {
        const charPool = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let code = '';
        for (let i = 0; i < length; i++)
            code += charPool.charAt(Math.floor(Math.random() * charPool.length));

        return code;
    };

    /**
     * @method isPasswordStrong
     * @description Validates a password against complexity requirements.
     * Criteria: Min 8 chars, at least one uppercase, one lowercase, one number, and one special character.
     * @param {string} password - The raw password string to validate.
     * @returns {boolean} True if the password meets security standards.
     */
    static isPasswordStrong = (password: string): boolean =>
        new RegExp(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*()])(?=.{8,})/).test(password);

    /**
     * @method sleep
     * @async
     * @description Promisified timeout to pause execution. 
     * Used mainly in testing or simulating network latency.
     * @param {number} ms - Milliseconds to sleep.
     * @returns {Promise<void>}
     */
    static sleep = (ms: number): Promise<void> =>
        new Promise(resolve => setTimeout(resolve, ms));

    /**
     * @method formatDate
     * @description Formats a Javascript Date object into a YYYY-MM-DD string.
     * @param {Date} date - The date to format.
     * @returns {string} Formatted date string.
     */
    static formatDate = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    /**
     * @method formatDateTime
     * @description Formats a Javascript Date object into an ISO-like string (YYYY-MM-DDTHH:mm:ss).
     * @param {Date} date - The date/time to format.
     * @returns {string} Formatted timestamp string.
     */
    static formatDateTime = (date: Date): string => {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${this.formatDate(date)}T${hours}:${minutes}:${seconds}`;
    };

    static calculateDeadline = (paper: any) => {
        const start = new Date(paper.liveAt).getTime();
        const durationMillis = paper.duration * 60 * 1000;
        return new Date(start + durationMillis + paper.pauseTime);
    }
}