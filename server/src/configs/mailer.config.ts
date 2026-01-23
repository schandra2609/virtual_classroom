/**
 * @file mailer.config.ts
 * @module Config/Mailer
 * @description Configures Nodemailer for automated transactional emails.
 * Primary use cases include email verification, password resets, and classroom invitations.
 */
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { ENV_CONFIG } from './env.config.js';
import Logger from '../utils/Logger.ts';

/**
 * @constant transporter
 * @type {Transporter}
 * @description The Nodemailer transporter instance using Gmail's SMTP service.
 */
export const transporter: Transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: ENV_CONFIG.MAILER.USER,
        pass: ENV_CONFIG.MAILER.APP_PASSWORD
    }
});

/**
 * @async
 * @function verifyTransporter
 * @description Validates the SMTP connection credentials on server startup.
 * @returns {Promise<void>}
 * @throws {Error} Logs error if fails to establish connection with MinIO server.
 */
export const verifyTransporter = async (): Promise<void> => {
    try {
        await transporter.verify();
        Logger.log('Mail transporter is ready to send emails');
    } catch (error) {
        Logger.error('Mail connection failed:');
        Logger.debug(error instanceof Error ? error.message : String(error));
    }
};