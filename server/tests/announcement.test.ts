import { clearDatabase } from "./setup.ts";
import request from "supertest";
import app from "../src/app.ts";
import { prisma } from "../src/configs/database.config.ts";

let tutorToken: string;
let studentToken: string;
let classroomId: string;
let announcementId: string;

describe("Classroom Announcements & Interactions", () => {
  beforeAll(async () => {
    await clearDatabase();

    // 1. Setup: Register & Verify Tutor
    const tReg = await request(app).post("/api/v1/auth/register").send({
      fullName: "Feed Tutor", email: "ftutor@test.com", password: "TutorPassword@123", accountType: "TUTOR"
    });
    // Manually verify tutor via the TutorApplication ledger (schema refactored from User model)
    await prisma.tutorApplication.upsert({
      where: { id: `seed-${tReg.body.data.id}` },
      update: { status: "VERIFIED" },
      create: { id: `seed-${tReg.body.data.id}`, userId: tReg.body.data.id, status: "VERIFIED", documentUrl: "test" }
    });
    
    const tLogin = await request(app).post("/api/v1/auth/login").send({ email: "ftutor@test.com", password: "TutorPassword@123" });
    tutorToken = tLogin.body.data.accessToken;

    // 2. Setup: Register Student
    const sReg = await request(app).post("/api/v1/auth/register").send({
      fullName: "Feed Student", email: "fstudent@test.com", password: "StudentPassword@123", accountType: "STUDENT"
    });
    const sLogin = await request(app).post("/api/v1/auth/login").send({ email: "fstudent@test.com", password: "StudentPassword@123" });
    studentToken = sLogin.body.data.accessToken;
    const studentId = sReg.body.data.id;

    // 3. Create Classroom
    const cls = await request(app).post("/api/v1/classroom").set("Authorization", `Bearer ${tutorToken}`)
      .send({ name: "History 101", subject: "World History", batch: "2024" });
    classroomId = cls.body.data.id;

    // 4. Join & Approve Student
    await request(app).post("/api/v1/classroom/join").set("Authorization", `Bearer ${studentToken}`)
      .send({ joiningCode: cls.body.data.joiningCode });
    
    await prisma.classroomMember.update({
      where: { userId_classroomId: { userId: studentId, classroomId: classroomId } },
      data: { membershipStatus: "APPROVED" }
    });
  });

  it("Step 1: Tutor posts an announcement with material", async () => {
    const fileBuffer = Buffer.from("Important Syllabus Update");

    const res = await request(app)
      .post(`/api/v1/classroom/${classroomId}/announcements`)
      .set("Authorization", `Bearer ${tutorToken}`)
      // Corrected to 'message' (from previous step fix)
      .field("message", "Mid-Term Syllabus: Please read the attached PDF carefully.")
      .attach("attachments", fileBuffer, "syllabus.pdf");

    expect(res.statusCode).toBe(201);
    expect(res.body.data.message).toContain("Mid-Term Syllabus");
    announcementId = res.body.data.id;
  });

  it("Step 2: Student comments on the announcement", async () => {
    if (!announcementId) throw new Error("Skipping Step 2: Announcement ID missing");

    const res = await request(app)
      .post(`/api/v1/classroom/${classroomId}/announcements/${announcementId}/comments`)
      .set("Authorization", `Bearer ${studentToken}`)
      // FIX: Changed 'content' to 'text' to match comment.controller.ts
      .send({ text: "Is Chapter 4 included?" });

    if (res.statusCode !== 201) {
        console.error("Comment Failed:", res.body);
    }
    
    expect(res.statusCode).toBe(201);
    // Controller returns the created comment object
    expect(res.body.data.text).toBe("Is Chapter 4 included?");
  });

  it("Step 3: Retrieve the Feed and verify nested structure", async () => {
    const res = await request(app)
      .get(`/api/v1/classroom/${classroomId}/announcements`)
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    
    const post = res.body.data.find((a: any) => a.id === announcementId);
    expect(post).toBeTruthy();
    expect(post.message).toContain("Mid-Term Syllabus");
    
    // Verify comment count aggregation from getAnnouncements controller
    if (post._count) {
        expect(post._count.comments).toBeGreaterThanOrEqual(1);
    }
  });

  it("Step 4: Student cannot delete the Tutor's announcement", async () => {
    if (!announcementId) throw new Error("Skipping Step 4: Announcement ID missing");
    
    const res = await request(app)
      .delete(`/api/v1/classroom/${classroomId}/announcements/${announcementId}`)
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.statusCode).toBe(403);
  });
});