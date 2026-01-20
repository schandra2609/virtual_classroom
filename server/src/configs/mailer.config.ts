import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { ENV_CONFIG } from './env.config.js';
import Logger from '../utils/Logger.ts';

export const transporter: Transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: ENV_CONFIG.MAILER.USER,
        pass: ENV_CONFIG.MAILER.APP_PASSWORD
    }
});

export const verifyTransporter = async (): Promise<void> => {
    try {
        await transporter.verify();
        Logger.log('Mail transporter is ready to send emails');
    } catch (error) {
        Logger.error('Mail connection failed:');
        Logger.debug(error instanceof Error ? error.message : String(error));
    }
};