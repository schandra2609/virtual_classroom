import chalk from 'chalk';

type Highlighter = (text: string) => string;

export default class Logger {
    static log(message: string, highlighter: Highlighter = chalk.blueBright.bold): void {
        console.log(highlighter(`[LOG] ${message}`));
    }

    static error(message: string, highlighter: Highlighter = chalk.redBright.bold): void {
        console.error(highlighter(`[ERROR] ${message}`));
    }

    static warn(message: string, highlighter: Highlighter = chalk.yellowBright.italic): void {
        console.warn(highlighter(`[WARN] ${message}`));
    }

    static info(message: string, highlighter: Highlighter = chalk.cyanBright.italic): void {
        console.info(highlighter(`[INFO] ${message}`));
    }

    static debug(message: string, highlighter: Highlighter = chalk.magentaBright.italic): void {
        console.debug(highlighter(`[DEBUG] ${message}`));
    }
};