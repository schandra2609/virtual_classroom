import { clearDatabase } from "./setup.ts";
import request from "supertest";
import app from "../src/app.ts";
import { prisma } from "../src/configs/database.config.ts";

let tutorToken: string;
let studentToken: string;
let createdClassroomId: string;
let joiningCode: string;

describe("Classroom Module", () => {
  beforeAll(async () => {
    await clearDatabase();

    // 1. Create a Tutor
    await request(app).post("/api/v1/auth/register").send({
      fullName: "Tutor User",
      email: "tutor@test.com",
      password: "Password@123",
      accountType: "TUTOR",
    });

    // 2. Manually Verify Tutor via the TutorApplication ledger (schema refactored from User model)
    const tutorUser = await prisma.user.findUnique({ where: { email: "tutor@test.com" }, select: { id: true } });
    await prisma.tutorApplication.upsert({
      where: { id: `seed-${tutorUser!.id}` },
      update: { status: "VERIFIED" },
      create: { id: `seed-${tutorUser!.id}`, userId: tutorUser!.id, status: "VERIFIED", documentUrl: "test" }
    });

    // 3. Login Tutor to get Token
    const tutorLogin = await request(app).post("/api/v1/auth/login").send({
      email: "tutor@test.com",
      password: "Password@123",
    });
    tutorToken = tutorLogin.body.data.accessToken;

    // 4. Create & Login Student
    await request(app).post("/api/v1/auth/register").send({
      fullName: "Student User",
      email: "student@test.com",
      password: "Password@123",
      accountType: "STUDENT",
    });
    const studentLogin = await request(app).post("/api/v1/auth/login").send({
      email: "student@test.com",
      password: "Password@123",
    });
    studentToken = studentLogin.body.data.accessToken;
  });

  it("POST /api/v1/classroom - Verified Tutor can create classroom", async () => {
    const res = await request(app)
      .post("/api/v1/classroom")
      .set("Authorization", `Bearer ${tutorToken}`)
      .send({
        name: "Physics 101",
        subject: "Science",
        batch: "2026",
      });

    expect(res.statusCode).toBe(201);
    createdClassroomId = res.body.data.id;
    joiningCode = res.body.data.joiningCode;
  });

  it("POST /api/v1/classroom/join - Student can join via code", async () => {
    const res = await request(app)
      .post("/api/v1/classroom/join")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({
        joiningCode: joiningCode,
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.membershipStatus).toBe("PENDING");
  });

  it("GET /api/v1/classroom - Should list classrooms for Tutor", async () => {
    const res = await request(app)
      .get("/api/v1/classroom")
      .set("Authorization", `Bearer ${tutorToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });
});
