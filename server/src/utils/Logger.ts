/**
 * @file Logger.ts
 * @module Utils/Logger
 * @description Wrapper around console methods using Chalk for colorized terminal output.
 * Facilitates easier debugging and logs monitoring during development.
 */
import chalk from 'chalk';

/** 
 * @typedef {function(string): string} Highlighter 
 * @description A Chalk function that applies color/style to a string.
 */
type Highlighter = (text: string) => string;

/**
 * @class Logger
 * @description - Facilitates with colored logs for different kind of data.
 * Types: Log | Error | Warn | Info | Debug
 */
export default class Logger {
    /**
     * @method log
     * @description Standard operational log. Output in Bold Blue.
     * @param {string} message - Content to log.
     * @param {Highlighter} [highlighter] - Optional chalk style override.
     */
    static log(message: string, highlighter: Highlighter = chalk.blueBright.bold): void {
        console.log(highlighter(`[LOG] ${message}`));
    }

    /**
     * @method error
     * @description Critical error log. Output in Bold Red.
     * @param {string} message - Error description.
     * @param {Highlighter} [highlighter] - Optional chalk style override.
     */
    static error(message: string, highlighter: Highlighter = chalk.redBright.bold): void {
        console.error(highlighter(`[ERROR] ${message}`));
    }

    /**
     * @method warn
     * @description Warning log for non-breaking issues. Output in Italic Yellow.
     * @param {string} message - Warning description.
     * @param {Highlighter} [highlighter] - Optional chalk style override.
     */
    static warn(message: string, highlighter: Highlighter = chalk.yellowBright.italic): void {
        console.warn(highlighter(`[WARN] ${message}`));
    }

    /**
     * @method info
     * @description Informational log for system events. Output in Italic Cyan.
     * @param {string} message - Information content.
     * @param {Highlighter} [highlighter] - Optional chalk style override.
     */
    static info(message: string, highlighter: Highlighter = chalk.cyanBright.italic): void {
        console.info(highlighter(`[INFO] ${message}`));
    }

    /**
     * @method debug
     * @description Verbose logging for tracing logic flow. Output in Italic Magenta.
     * @param {string} message - Trace data.
     * @param {Highlighter} [highlighter] - Optional chalk style override.
     */
    static debug(message: string, highlighter: Highlighter = chalk.magentaBright.italic): void {
        console.debug(highlighter(`[DEBUG] ${message}`));
    }
};