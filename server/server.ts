/**
 * @file server.ts
 * @module Core/Bootstrapper
 * @description The hardware-level entry point of the application.
 * This script is responsible for:
 * 1. Initializing infrastructure connections (PostgreSQL, MinIO, SMTP).
 * 2. Running data synchronization/seeding (Administrator account).
 * 3. Starting the HTTP listener.
 * 4. Managing process lifecycle and graceful shutdowns.
 * @author Sayan Chandra
 */
import app from "./src/app.ts";
import bcrypt from "bcrypt";
import chalk from "chalk";
import { ENV_CONFIG } from "./src/configs/env.config.ts";
import { prisma } from "./src/configs/database.config.ts";
import { dayjs } from "./src/configs/dayjs.config.ts";
import { initializeStorage } from "./src/configs/minio.config.ts";
import { verifyTransporter } from "./src/configs/mailer.config.ts";
import { verifyArcjetConnection } from "./src/configs/arcjet.config.ts";
import Logger from "./src/utils/Logger.ts";

/**
 * @async
 * @function seedAdmin
 * @description Bootstraps the system with an initial Administrator account.
 * Logic:
 * - Checks if an account with type 'ADMINISTRATOR' exists using the configured ADMIN_EMAIL.
 * - If missing, creates a new record with a 100-year verification validity and
 *   pre-verified status for both email and tutor roles.
 * - If present, logs an info message to confirm the admin layer is ready.
 * @returns {Promise<void>}
 * @throws {Error} If database write or password hashing fails.
 */
const seedAdmin = async (): Promise<void> => {
  try {
    const existingAdmin = await prisma.user.findUnique({
      where: { email: ENV_CONFIG.ADMIN.EMAIL, accountType: "ADMINISTRATOR" },
    });

    if (existingAdmin) {
      Logger.info("Administrator account has been updated");
    } else {
      const hashedPassword = await bcrypt.hash(ENV_CONFIG.ADMIN.PASSWORD!, 10);
      await prisma.user.create({
        data: {
          email: ENV_CONFIG.ADMIN.EMAIL,
          password: hashedPassword,
          accountType: "ADMINISTRATOR",
          fullName: "Virtual Classroom Admin",
          isEmailVerified: true,
          // Set expiry to a century from now for the root admin
          emailVerificationExpiry: dayjs().add(100, "year").toDate(),
          tutorVerificationStatus: "VERIFIED",
          tutorStatusUpdatedAt: new Date(),
        },
      });
      Logger.log("Administrator account has been created");
    }
  } catch (error) {
    Logger.error("Error seeding administrator.");
    Logger.debug(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
};

/**
 * @async
 * @function startServer
 * @description Orchestrates the startup sequence of the backend.
 * Sequence:
 * 1. Establish PostgreSQL connection via Prisma.
 * 2. Verify/Create MinIO buckets.
 * 3. Verify SMTP (Mailer) credentials.
 * 4. Seed the Admin user.
 * 5. Bind the Express app to the configured network port.
 * @returns {Promise<void>}
 */
const startServer = async (): Promise<void> => {
  try {
    // Step 1: Database
    await prisma.$connect();
    Logger.log("Database connected successfully.");

    // Step 2: Object Storage
    await initializeStorage();

    // Step 3: Mail Service
    await verifyTransporter();

    // Step 4: Arcjet Connection
    await verifyArcjetConnection();

    // Step 5: System Seeding
    await seedAdmin();

    // Step 6: Start Listening
    app.listen(ENV_CONFIG.PORT, () => {
      Logger.log(
        chalk.greenBright.bold.italic(">>> ") +
          chalk.bgGreenBright.black.italic.bold(
            ` Server running in ${ENV_CONFIG.NODE_ENV} mode on port ${ENV_CONFIG.PORT} `,
          ),
      );
    });
  } catch (error) {
    // Clean up on failure
    await prisma.$disconnect();
    Logger.error("Shutting down server due to startup failure.");
    Logger.debug(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
};

/**
 * @section Process Event Listeners
 * @description Global handlers for process-level events to ensure
 * data integrity and clean resource release.
 */

/**
 * @event unhandledRejection
 * @description Handles Promise rejections that aren't caught in local try-catch blocks.
 */
process.on("unhandledRejection", async (error) => {
  await prisma.$disconnect();
  Logger.error("Critical: Unhandled Promise Rejection.");
  Logger.debug(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

/**
 * @event uncaughtException
 * @description Handles synchronous errors that bubble up to the process level.
 */
process.on("uncaughtException", async (error) => {
  await prisma.$disconnect();
  Logger.error("Critical: Uncaught Exception.");
  Logger.debug(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

/**
 * @event SIGINT
 * @description Triggered by (Ctrl+C). Ensures Prisma disconnects gracefully.
 */
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  Logger.log(
    "\nSIGINT received: Prisma Client disconnected. Shutting down.",
    chalk.redBright.italic,
  );
  process.exit(0);
});

/**
 * @event SIGTERM
 * @description Triggered by process managers (like PM2 or Docker). Ensures clean shutdown.
 */
process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  Logger.log(
    "\nSIGTERM received: Prisma Client disconnected. Shutting down.",
    chalk.redBright.italic,
  );
  process.exit(0);
});

// Execute the bootstrap sequence
await startServer();
