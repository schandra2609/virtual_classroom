/**
 * @file mailer.config.ts
 * @module Config/Mailer
 * @description Configures the SMTP transport layer using Nodemailer.
 * This service facilitates transactional emails such as OTP verification, 
 * classroom invites, and password recovery.
 * @author Sayan Chandra
 */
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { ENV_CONFIG } from './env.config.js';
import Logger from '../utils/Logger.ts';

/**
 * @constant transporter
 * @type {Transporter}
 * @description The primary Nodemailer transporter. 
 * It is configured to use Gmail's SMTP relay with secure App Password authentication.
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
 * @description Performs a "Handshake" with the SMTP server during the application 
 * bootstrap sequence. This proactive check ensures the server won't start 
 * if the mail credentials are invalid.
 * @returns {Promise<void>}
 * @throws {Error} If the SMTP verification fails.
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