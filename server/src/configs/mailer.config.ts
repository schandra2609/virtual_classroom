import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { ENV_CONFIG } from './env.config.js';

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
        console.log('Mail transporter is ready to send emails');
    } catch (error) {
        console.error('Mail connection failed:');
        console.error(error instanceof Error ? error.message : error);
    }
};