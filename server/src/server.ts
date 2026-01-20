import app from "./app.ts";
import bcrypt from "bcrypt";
import chalk from "chalk";
import { ENV_CONFIG } from "./configs/env.config.ts";
import { prisma } from "./configs/database.config.ts";
import { dayjs } from "./configs/dayjs.config.ts";
import { initializeStorage } from "./configs/minio.config.ts";


const seedAdmin = async () : Promise<void> => {
	try {
		const existingAdmin = await prisma.user.findUnique({
			where: { email: ENV_CONFIG.ADMIN.EMAIL, accountType: "ADMINISTRATOR" },
		});

		if(existingAdmin) {
			console.log(chalk.magenta.bold("Administrator account has been updated"));
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
			console.log(chalk.magenta.bold("Administrator account has been created"));
		}
	} catch (error) {
		console.error(chalk.red("❌ Error seeding administrator:"), error);
        process.exit(1);
	}
};

const startServer = async () : Promise<void> => {
	try {
		await prisma.$connect();
		console.log(chalk.greenBright.italic("Database connected successfully"));
		await seedAdmin();
		await initializeStorage();
		app.listen(ENV_CONFIG.PORT, () => {
            console.log(
				chalk.greenBright.italic(">>> ") +
                chalk.bgGreenBright.black.italic.bold(
                    ` Server running in ${ENV_CONFIG.NODE_ENV} mode on port ${ENV_CONFIG.PORT} `
                )
            );
        });
	} catch (error) {
		console.error(
			chalk.red("Failed to start server or connect to database: ") +
			(error instanceof Error ? error.message : String(error))
		);
        process.exit(1);
	}
};

process.on("unhandledRejection", (reason, promise) => {
	console.error(chalk.red("Unhandled Rejection at:"), promise, "reason:", reason);
	process.exit(1);
});

process.on("uncaughtException", (error) => {
	console.error(chalk.red("Uncaught Exception thrown:"), error);
	process.exit(1);
});

process.on("SIGINT", async () => {
	await prisma.$disconnect();
	console.log(chalk.redBright("\nPrisma Client disconnected. Shutting down server."));
    process.exit(0);
});

process.on("SIGTERM", async () => {
	await prisma.$disconnect();
	console.log(chalk.redBright("\nPrisma Client disconnected. Shutting down server."));
	process.exit(0);
});

await startServer();