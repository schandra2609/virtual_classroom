/**
 * @file email.service.ts
 * @module Services/Email
 * @description Service module for handling all email-related operations.
 * It abstracts the Nodemailer transporter and uses the Email utility class
 * to generate and send transactional emails.
 * @author Sayan Chandra
 */
import { transporter } from "../configs/mailer.config.ts";
import { ENV_CONFIG } from "../configs/env.config.ts";
import Email from "../utils/Email.ts";
import Logger from "../utils/Logger.ts";

/**
 * @interface User
 * @description Represents a user entity for email purposes.
 */
interface User {
  name: string;
  email: string;
}

/**
 * @interface EmailOptions
 * @description Options for configuring the email payload.
 */
interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

/**
 * @async
 * @function sendEmail
 * @description Low-level wrapper function to send an email using the configured Nodemailer transporter.
 * It constructs the mail options and dispatches the email.
 * Errors are caught and logged to prevent the application from crashing during background email tasks.
 * @param {EmailOptions} options - Configuration object containing recipient, subject, and HTML body.
 * @returns {Promise<void>} Resolves when the email is sent, or logs an error if failed.
 */
const sendEmail = async (options: EmailOptions): Promise<void> => {
  if (ENV_CONFIG.NODE_ENV === "test") {
    Logger.debug(
      `[TEST] Skipping email to ${options.to} (subject: ${options.subject})`,
    );
    return;
  }
  try {
    const mailOptions = {
      from: ENV_CONFIG.MAILER.USER, // Ensuring we use the configured sender
      to: options.to,
      subject: options.subject,
      html: options.html,
    };

    await transporter.sendMail(mailOptions);
    Logger.info(`Email sent to ${options.to} with subject: ${options.subject}`);
  } catch (error) {
    Logger.error(`Error sending email to ${options.to}:`);
    Logger.debug(error instanceof Error ? error.message : String(error));
  }
};

/**
 * @async
 * @function sendWelcomeEmail
 * @description Orchestrates the creation and sending of a welcome email.
 * Called when a new user successfully registers.
 * @param {User} user - The new user object.
 * @param {string} url - The dashboard URL for the user to visit.
 * @returns {Promise<void>}
 */
export const sendWelcomeEmail = async (
  user: User,
  url: string,
): Promise<void> => {
  const email = new Email(user, url);
  const { subject, html } = email.getWelcomeTemplate();
  await sendEmail({ to: user.email, subject, html });
};

/**
 * @async
 * @function sendPasswordResetEmail
 * @description Orchestrates the creation and sending of a password reset email.
 * Called when a user requests to reset their forgotten password.
 * @param {User} user - The user requesting the reset.
 * @param {string} url - The unique password reset link containing the token.
 * @returns {Promise<void>}
 */
export const sendPasswordResetEmail = async (
  user: User,
  url: string,
): Promise<void> => {
  const email = new Email(user, url);
  const { subject, html } = email.getPasswordResetTemplate();
  await sendEmail({ to: user.email, subject, html });
};

/**
 * @async
 * @function sendOTP
 * @description Orchestrates the creation and sending of an OTP verification email.
 * Uses the simple OTP template without a specific action URL.
 * @param {User} user - The user verifying their account.
 * @param {string} otp - The One-Time Password code.
 * @returns {Promise<void>}
 */
export const sendOTP = async (user: User, otp: string): Promise<void> => {
  const email = new Email(user, ""); // URL not needed for OTP
  const { subject, html } = email.getOTPTemplate(otp);
  await sendEmail({ to: user.email, subject, html });
};

/**
 * @async
 * @function sendClassroomInvite
 * @description Orchestrates the creation and sending of a classroom invitation email.
 * Provides the user with a direct link to join the classroom.
 * @param {User} user - The invited user.
 * @param {string} url - The invitation acceptance link.
 * @param {string} classroomName - The name of the classroom.
 * @param {string} role - The role assigned to the user (e.g., 'Student', 'Teacher').
 * @returns {Promise<void>}
 */
export const sendClassroomInvite = async (
  user: User,
  url: string,
  classroomName: string,
  role: string,
): Promise<void> => {
  const email = new Email(user, url);
  const { subject, html } = email.getClassroomInviteTemplate(
    classroomName,
    role,
  );
  await sendEmail({ to: user.email, subject, html });
};

/**
 * @async
 * @function sendMaterialNotification
 * @description Sends a notification email to multiple users about new classroom content.
 * Useful for alerting all students when a tutor posts an announcement or assignment.
 * @param {User[]} users - List of users to receive the notification.
 * @param {"Announcement" | "Assignment"} type - The content category.
 * @param {string} title - The title of the new material.
 * @param {string} classroomName - The name of the classroom.
 * @param {string} url - Deep link to the material in the dashboard.
 * @returns {Promise<void>}
 */
export const sendMaterialNotification = async (
  users: User[],
  type: "Announcement" | "Assignment",
  title: string,
  classroomName: string,
  url: string,
): Promise<void> => {
  try {
    await Promise.all(
      users.map(async (user) => {
        const email = new Email(user, url);
        const { subject, html } = email.getMaterialNotificationTemplate(
          type,
          title,
          classroomName,
        );
        return sendEmail({ to: user.email, subject, html });
      }),
    );
    Logger.info(
      `Bulk notification sent for ${type} in ${classroomName} to ${users.length} users.`,
    );
  } catch (error) {
    Logger.error(
      `Error in bulk material notification: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
};
