/**
 * @file Email.ts
 * @module Utils/Email
 * @description Utility class responsible for managing email templates.
 * It handles the loading of HTML templates and the injection of dynamic content
 * such as user names, verification codes, and action URLs.
 * @author Sayan Chandra
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { ENV_CONFIG } from "../configs/env.config.ts";

/**
 * @interface User
 * @description Represents a user entity for email purposes.
 */
interface User {
    name: string;
    email: string;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * @class Email
 * @classdesc Utility class for generating email content from templates.
 * Handles loading the HTML template and replacing placeholders with actual data.
 * This class isolates the view logic for emails from the sending logic.
 */
export default class Email {
    to: string;
    name: string;
    url: string;
    from: string;

    /**
     * @constructor
     * @description Initializes the Email instance with user details and context URL.
     * @param {User} user - The user object containing name and email.
     * @param {string} url - The action URL (e.g., dashboard link, reset link).
     */
    constructor(user: User, url: string) {
        this.to = user.email;
        this.name = user.name;
        this.url = url;
        this.from = `${ENV_CONFIG.MAILER.USER}`;
    }

    /**
     * @private
     * @method _loadTemplate
     * @description Reads the master HTML template file from the file system.
     * Assumes the template is located at `./template.html` relative to the CWD.
     * @returns {string} The raw HTML template string.
     */
    private _loadTemplate(): string {
        const templatePath = path.resolve(__dirname, "./template.html");
        return fs.readFileSync(templatePath, "utf-8");
    }

    /**
     * @private
     * @method _replacePlaceholders
     * @description Replaces standard placeholders in the template with actual values.
     * It also automatically injects the current year for the copyright footer.
     * @param {string} template - The raw HTML template.
     * @param {string} title - The email title/subject header.
     * @param {string} bodyContent - The main body content (HTML).
     * @returns {string} The final HTML string with data injected.
     */
    private _replacePlaceholders(
        template: string,
        title: string,
        bodyContent: string,
    ): string {
        return template
            .replace(/\${title}/g, title)
            .replace(/\${userName}/g, this.name)
            .replace(/\${bodyContent}/g, bodyContent)
            .replace(/\${currentYear}/g, new Date().getFullYear().toString());
    }

    /**
     * @public
     * @method getWelcomeTemplate
     * @description Generates the welcome email content for new users.
     * Includes a link to the dashboard.
     * @returns {{ subject: string; html: string }} The email subject and HTML body.
     */
    public getWelcomeTemplate(): { subject: string; html: string } {
        const title = "Welcome to Virtual Classroom!";
        const body = `
                <p>We are excited to have you on board.</p>
                <p>To get started, please visit your dashboard: <a href="${this.url}" style="color: #0e7490; text-decoration: none; font-weight: 600;">Go to Dashboard</a></p>
                <p>If you have any questions, feel free to reply to this email.</p>
            `;
        const template = this._loadTemplate();
        const html = this._replacePlaceholders(template, title, body);

        return {
            subject: title,
            html,
        };
    }

    /**
     * @public
     * @method getPasswordResetTemplate
     * @description Generates the password reset email content.
     * Contains a time-sensitive link to reset the password.
     * @returns {{ subject: string; html: string }} The email subject and HTML body.
     */
    public getPasswordResetTemplate(): { subject: string; html: string } {
        const title = "Password Reset Request";
        const body = `
                <p>We received a request to reset your password.</p>
                <p>Click the button below to reset it (valid for 10 minutes):</p>
                <div style="text-align: center; margin: 24px 0;">
                    <a href="${this.url}" style="display: inline-block; background-color: #0e7490; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 16px;">Reset Password</a>
                </div>
                <p>If you didn't request this, please ignore this email.</p>
            `;
        const template = this._loadTemplate();
        const html = this._replacePlaceholders(template, title, body);

        return {
            subject: title,
            html,
        };
    }

    /**
     * @public
     * @method getOTPTemplate
     * @description Generates the OTP verification email content.
     * Displays the code prominently for easy reading.
     * @param {string} otp - The One-Time Password code.
     * @returns {{ subject: string; html: string }} The email subject and HTML body.
     */
    public getOTPTemplate(otp: string): { subject: string; html: string } {
        const title = "Your Verification Code";
        const body = `
                    <p>Your One-Time Password (OTP) for verification is:</p>
                    <div style="text-align: center; margin: 24px 0;">
                            <span style="display: inline-block; background-color: #e2e8f0; color: #0f766e; padding: 12px 24px; border-radius: 6px; font-weight: 700; font-size: 24px; letter-spacing: 4px;">${otp}</span>
                    </div>
                    <p>This code is valid for 10 minutes. Do not share this code with anyone.</p>
                `;
        const template = this._loadTemplate();
        const html = this._replacePlaceholders(template, title, body);

        return {
            subject: title,
            html,
        };
    }

    /**
     * @public
     * @method getClassroomInviteTemplate
     * @description Generates the classroom invitation email content.
     * Includes details about the classroom and the role assigned.
     * @param {string} classroomName - The name of the classroom.
     * @param {string} role - The role the user is invited as (e.g., student, teacher).
     * @returns {{ subject: string; html: string }} The email subject and HTML body.
     */
    public getClassroomInviteTemplate(
        classroomName: string,
        role: string,
    ): { subject: string; html: string } {
        const title = "Classroom Invitation";
        const body = `
                <p>You have been invited to join the classroom <strong>${classroomName}</strong> as a <strong>${role}</strong>.</p>
                <div style="text-align: center; margin: 24px 0;">
                    <a href="${this.url}" style="display: inline-block; background-color: #0e7490; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 16px;">Accept Invitation</a>
                </div>
            `;
        const template = this._loadTemplate();
        const html = this._replacePlaceholders(template, title, body);

        return {
            subject: title,
            html,
        };
    }

    /**
     * @public
     * @method getMaterialNotificationTemplate
     * @description Generates a notification email for new classroom materials (Announcements/Assignments).
     * @param {string} type - The type of material ('Announcement' or 'Assignment').
     * @param {string} title - The title or summary of the material.
     * @param {string} classroomName - The name of the classroom where it was posted.
     * @returns {{ subject: string; html: string }} The email subject and HTML body.
     */
    public getMaterialNotificationTemplate(
        type: "Announcement" | "Assignment",
        title: string,
        classroomName: string,
    ): { subject: string; html: string } {
        const subject = `New ${type} in ${classroomName}`;
        const bodyContent = `
                <p>Hello ${this.name},</p>
                <p>A new <strong>${type.toLowerCase()}</strong> has been posted in your classroom <strong>${classroomName}</strong>.</p>
                <div style="background-color: #f8fafc; border-left: 4px solid #0e7490; padding: 16px; margin: 24px 0;">
                    <p style="margin: 0; font-weight: 600; color: #1e293b;">${title}</p>
                </div>
                <div style="text-align: center; margin: 24px 0;">
                    <a href="${this.url}" style="display: inline-block; background-color: #0e7490; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 16px;">View ${type}</a>
                </div>
                <p>Stay updated with your classroom activities!</p>
            `;
        const template = this._loadTemplate();
        const html = this._replacePlaceholders(template, subject, bodyContent);

        return {
            subject,
            html,
        };
    }
}
