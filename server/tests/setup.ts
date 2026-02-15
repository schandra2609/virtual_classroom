import dotenv from "dotenv";
import path from "path";

// 1. Load .env.test BEFORE importing Prisma
dotenv.config({ path: path.resolve(process.cwd(), ".env.test") });

import { PrismaClient } from "../generated/prisma/client.ts";
import { jest } from "@jest/globals";

const prisma = new PrismaClient();

// --- MOCK ARCJET ---
jest.mock("../src/configs/arcjet.config.ts", () => ({
  ajConfig: {
    protect: jest.fn<any>().mockResolvedValue({
      isDenied: () => false,
      isAllowed: () => true,
      reason: { isRateLimit: () => false, isBot: () => false },
    }),
  },
  verifyArcjetConnection: jest.fn(),
}));

// --- MOCK PASSPORT ---
jest.mock("../src/configs/passport.config.ts", () => ({
  configureGoogleStrategy: jest.fn(),
}));

// --- MOCK NODEMAILER ---
jest.mock("../src/services/email.service.ts", () => ({
  sendWelcomeEmail: jest.fn(),
  sendOTP: jest.fn(),
  sendClassroomInvite: jest.fn(),
  sendMaterialNotification: jest.fn(),
}));

// --- MOCK MINIO ---
jest.mock("../src/services/storage.service.ts", () => ({
  uploadBuffer: jest.fn<any>().mockResolvedValue("mocked-file-url.jpg"),
  deleteFile: jest.fn(),
}));

export const clearDatabase = async () => {
  try {
    const tablenames = await prisma.$queryRaw<
      Array<{ tablename: string }>
    >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

    const tables = tablenames
      .map(({ tablename }) => tablename)
      .filter((name) => name !== "_prisma_migrations")
      .map((name) => `"public"."${name}"`)
      .join(", ");

    if (tables.length > 0) {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
    }
  } catch (error) {
    console.log({ error });
  }
};

afterAll(async () => {
  await prisma.$disconnect();
});
