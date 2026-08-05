import { clearDatabase } from "./setup.ts";
import request from "supertest";
import app from "../src/app.ts";
import { prisma } from "../src/configs/database.config.ts";

let adminToken: string;
let tutorToken: string;
let tutorId: string;

describe("Admin & Tutor Verification Workflow", () => {
  beforeAll(async () => {
    // 1. Reset Database
    await clearDatabase();

    // 2. Setup Admin Account
    // Step A: Register as a normal user (STUDENT) via API to handle password hashing
    const adminReg = await request(app).post("/api/v1/auth/register").send({
      fullName: "System Administrator",
      email: "admin@test.com",
      password: "AdminPassword@123", // Meets Helper.isPasswordStrong criteria
      accountType: "STUDENT"
    });
    
    if (!adminReg.body.success) {
      throw new Error(`Admin Pre-registration failed: ${adminReg.body.message}`);
    }
    const adminUserId = adminReg.body.data.id;

    // Step B: Elevate to ADMINISTRATOR using Prisma
    // We use 'as any' to bypass TS strict typing if the Enum isn't imported, 
    // but the string literal "ADMINISTRATOR" matches your schema.prisma definition.
    await prisma.user.update({
      where: { id: adminUserId },
      data: { 
        accountType: "ADMINISTRATOR" as any, 
        isEmailVerified: true 
      }
    });

    // Step C: Login to get the Admin Token
    const adminLogin = await request(app).post("/api/v1/auth/login").send({
      email: "admin@test.com",
      password: "AdminPassword@123"
    });
    adminToken = adminLogin.body.data.accessToken;

    // 3. Setup Tutor Account (Unverified)
    const tutorReg = await request(app).post("/api/v1/auth/register").send({
      fullName: "Pending Tutor",
      email: "tutor@test.com",
      password: "TutorPassword@123",
      accountType: "TUTOR"
    });
    tutorId = tutorReg.body.data.id;

    const tutorLogin = await request(app).post("/api/v1/auth/login").send({
      email: "tutor@test.com",
      password: "TutorPassword@123"
    });
    tutorToken = tutorLogin.body.data.accessToken;
  });

  it("Step 1: Unverified Tutor should NOT be able to create a classroom", async () => {
    // Logic: isVerifiedTutor middleware checks if verificationStatus === 'VERIFIED'
    const res = await request(app)
      .post("/api/v1/classroom")
      .set("Authorization", `Bearer ${tutorToken}`)
      .send({ name: "Illegal Class", subject: "Math", batch: "2024" });

    expect(res.statusCode).toBe(403);
    // The error message usually contains "verify" or "pending"
    expect(res.body.message).toMatch("This action is restricted to VERIFIED TUTORs only.");
  });

  it("Step 2: Admin should be able to view pending tutor applications", async () => {
    // Logic: AdminController.getTutors filters by status
    const res = await request(app)
      .get("/api/v1/admin/tutors?status=PENDING")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    // Verify our specific tutor is in the list
    const found = res.body.data.some((t: any) => t.id === tutorId);
    expect(found).toBe(true);
  });

  it("Step 3: Admin approves the Tutor", async () => {
    // Logic: AdminController.verifyTutor updates status to VERIFIED
    const res = await request(app)
      .patch(`/api/v1/admin/tutors/${tutorId}/approve`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    
    // Double check via DB — verification status lives in TutorApplication, not User
    const application = await prisma.tutorApplication.findFirst({ where: { userId: tutorId } });
    expect(application?.status).toBe("VERIFIED");
  });

  it("Step 4: Verified Tutor should now be able to create a classroom", async () => {
    const res = await request(app)
      .post("/api/v1/classroom")
      .set("Authorization", `Bearer ${tutorToken}`)
      .send({ name: "Legal Class", subject: "Science", batch: "2024" });

    expect(res.statusCode).toBe(201);
    expect(res.body.data).toHaveProperty("id");
    expect(res.body.data.name).toBe("Legal Class");
  });
});