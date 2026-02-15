import { clearDatabase } from "./setup.ts";
import request from "supertest";
import app from "../src/app.ts";
import { prisma } from "../src/configs/database.config.ts";
import { dayjs } from "../src/configs/dayjs.config.ts";

let tutorToken: string;
let classroomId: string;
let paperId: string;

describe("Question Paper Module", () => {
  beforeAll(async () => {
    await clearDatabase();

    // Setup: Register Verified Tutor & Login
    await request(app).post("/api/v1/auth/register").send({
      fullName: "Exam Tutor",
      email: "examtutor@test.com",
      password: "Password@123",
      accountType: "TUTOR",
    });
    await prisma.user.update({
      where: { email: "examtutor@test.com" },
      data: { tutorVerificationStatus: "VERIFIED" },
    });
    const login = await request(app).post("/api/v1/auth/login").send({
      email: "examtutor@test.com",
      password: "Password@123",
    });
    tutorToken = login.body.data.accessToken;

    // Setup: Create Classroom
    const cls = await request(app)
      .post("/api/v1/classroom")
      .set("Authorization", `Bearer ${tutorToken}`)
      .send({ name: "Maths", subject: "Calculus", batch: "A" });
    classroomId = cls.body.data.id;
  });

  it("POST /papers - Should create a scheduled exam", async () => {
    const futureDate = dayjs().add(1, "day").toISOString();

    const res = await request(app)
      .post(`/api/v1/classroom/${classroomId}/papers`)
      .set("Authorization", `Bearer ${tutorToken}`)
      .send({
        title: "Mid-Sem Exam",
        duration: "60",
        liveAt: futureDate,
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.status).toBe("SCHEDULED");
    paperId = res.body.data.id;
  });

  it("PATCH /papers/:id/status - Should go LIVE", async () => {
    const res = await request(app)
      .patch(`/api/v1/classroom/${classroomId}/papers/${paperId}/status`)
      .set("Authorization", `Bearer ${tutorToken}`)
      .send({
        status: "LIVE",
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.status).toBe("LIVE");
  });

  it("PATCH /papers/:id/status - Should PAUSE exam (Time logic)", async () => {
    const res = await request(app)
      .patch(`/api/v1/classroom/${classroomId}/papers/${paperId}/status`)
      .set("Authorization", `Bearer ${tutorToken}`)
      .send({
        status: "PAUSED",
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.status).toBe("PAUSED");
  });
});
