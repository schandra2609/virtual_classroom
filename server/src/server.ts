import app from "./app.ts";
import bcrypt from "bcrypt";
import chalk from "chalk";
import { ENV_CONFIG } from "./configs/env.config.ts";
import { prisma } from "./configs/database.config.ts";
import { dayjs } from "./configs/dayjs.config.ts";
import { initializeStorage } from "./configs/minio.config.ts";
import { verifyTransporter } from "./configs/mailer.config.ts";
import Logger from "./utils/Logger.ts";


const seedAdmin = async () : Promise<void> => {
	try {
		const existingAdmin = await prisma.user.findUnique({
			where: { email: ENV_CONFIG.ADMIN.EMAIL, accountType: "ADMINISTRATOR" },
		});

		if(existingAdmin) {
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
					emailVerificationExpiry: dayjs().add(100, "year").toDate(),
					tutorVerificationStatus: "VERIFIED",
					tutorStatusUpdatedAt: new Date(),
				}
			});
			Logger.log("Administrator account has been created");
		}
	} catch (error) {
		Logger.error("Error seeding administrator.");
		Logger.debug(error instanceof Error ? error.message : String(error));
        process.exit(1);
	}
};

const startServer = async () : Promise<void> => {
	try {
		await prisma.$connect();
		Logger.log("Database connected successfully.");

		await initializeStorage();

		await verifyTransporter();

		await seedAdmin();

		app.listen(ENV_CONFIG.PORT, () => {
            Logger.log(
				chalk.greenBright.bold.italic(">>> ") +
                chalk.bgGreenBright.black.italic.bold(` Server running in ${ENV_CONFIG.NODE_ENV} mode on port ${ENV_CONFIG.PORT} `)
            );
        });
	} catch (error) {
		await prisma.$disconnect();
		Logger.error("Shutting down server due to startup failure.");
		Logger.debug(error instanceof Error ? error.message : String(error));
        process.exit(1);
	}
};

process.on("unhandledRejection", async (error) => {
	await prisma.$disconnect();
	Logger.error("Shutting down server due to unhandled promise rejection.");
	Logger.debug(error instanceof Error ? error.message : String(error));
	process.exit(1);
});

process.on("uncaughtException", async (error) => {
	await prisma.$disconnect();
	Logger.error("Shutting down server due to uncaught exception.");
	Logger.debug(error instanceof Error ? error.message : String(error));
	process.exit(1);
});

process.on("SIGINT", async () => {
	await prisma.$disconnect();
	Logger.log("\nPrisma Client disconnected. Shutting down server.", chalk.redBright.italic);
    process.exit(0);
});

process.on("SIGTERM", async () => {
	await prisma.$disconnect();
	Logger.log("\nPrisma Client disconnected. Shutting down server.", chalk.redBright.italic);
	process.exit(0);
});

await startServer();