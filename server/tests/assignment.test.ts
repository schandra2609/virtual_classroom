import { clearDatabase } from "./setup.ts";
import request from "supertest";
import app from "../src/app.ts";
import { prisma } from "../src/configs/database.config.ts";

let tutorToken: string;
let studentToken: string;
let classroomId: string;
let assignmentId: string;

describe("Assignment & Student Submission Workflow", () => {
  beforeAll(async () => {
    await clearDatabase();

    // 1. Setup: Register & Verify Tutor
    const tReg = await request(app).post("/api/v1/auth/register").send({
      fullName: "Assignment Tutor", email: "atutor@test.com", password: "TutorPassword@123", accountType: "TUTOR"
    });
    // Manually verify tutor via the TutorApplication ledger (schema refactored from User model)
    await prisma.tutorApplication.upsert({
      where: { id: `seed-${tReg.body.data.id}` },
      update: { status: "VERIFIED" },
      create: { id: `seed-${tReg.body.data.id}`, userId: tReg.body.data.id, status: "VERIFIED", documentUrl: "test" }
    });
    
    const tLogin = await request(app).post("/api/v1/auth/login").send({ email: "atutor@test.com", password: "TutorPassword@123" });
    tutorToken = tLogin.body.data.accessToken;

    // 2. Setup: Register Student
    const sReg = await request(app).post("/api/v1/auth/register").send({
      fullName: "Assignment Student", email: "astudent@test.com", password: "StudentPassword@123", accountType: "STUDENT"
    });
    const sLogin = await request(app).post("/api/v1/auth/login").send({ email: "astudent@test.com", password: "StudentPassword@123" });
    studentToken = sLogin.body.data.accessToken;
    const studentId = sReg.body.data.id;

    // 3. Create Classroom
    const cls = await request(app).post("/api/v1/classroom").set("Authorization", `Bearer ${tutorToken}`)
      .send({ name: "Physics Class", subject: "Mechanics", batch: "2024" });
    classroomId = cls.body.data.id;

    // 4. Join & Approve Student
    await request(app).post("/api/v1/classroom/join").set("Authorization", `Bearer ${studentToken}`)
      .send({ joiningCode: cls.body.data.joiningCode });
    
    await prisma.classroomMember.update({
      where: { userId_classroomId: { userId: studentId, classroomId: classroomId } },
      data: { membershipStatus: "APPROVED" }
    });
  });

  it("Step 1: Tutor creates an assignment with a file attachment", async () => {
    const fileBuffer = Buffer.from("dummy pdf content");

    const res = await request(app)
      .post(`/api/v1/classroom/${classroomId}/assignments`)
      .set("Authorization", `Bearer ${tutorToken}`)
      .field("title", "Newton's Laws")
      .field("description", "Solve the attached problems")
      .field("deadline", new Date(Date.now() + 86400000).toISOString()) // 24h future
      // CORRECTED: "attachments" based on your route config
      .attach("attachments", fileBuffer, "problem_set.pdf"); 

    if (res.statusCode !== 201) {
        console.error("Create Assignment Failed:", JSON.stringify(res.body, null, 2));
    }
    
    expect(res.statusCode).toBe(201);
    expect(res.body.data.title).toBe("Newton's Laws");
    assignmentId = res.body.data.id;
  });

  it("Step 2: Student submits a solution before deadline", async () => {
    if (!assignmentId) throw new Error("Skipping Step 2: Assignment ID missing from Step 1");

    const solutionBuffer = Buffer.from("my solution content");

    const res = await request(app)
      .post(`/api/v1/classroom/${classroomId}/assignments/${assignmentId}/submit`)
      .set("Authorization", `Bearer ${studentToken}`)
      .field("note", "Here is my homework")
      // CORRECTED: "solutions" based on your route config
      .attach("solutions", solutionBuffer, "solution.pdf");

    if (res.statusCode !== 201) {
        console.error("Submit Assignment Failed:", JSON.stringify(res.body, null, 2));
    }
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it("Step 3: Should block submission if deadline has passed", async () => {
    // 1. Create a VALID assignment first (future deadline) to pass API validation
    const futureDate = new Date(Date.now() + 3600000).toISOString(); // +1 hour
    const fileBuffer = Buffer.from("dummy content");
    
    const assignRes = await request(app)
      .post(`/api/v1/classroom/${classroomId}/assignments`)
      .set("Authorization", `Bearer ${tutorToken}`)
      .field("title", "Late Homework Test")
      .field("description", "This will be moved to the past")
      .field("deadline", futureDate) // Valid future date
      .attach("attachments", fileBuffer, "late.pdf");
    
    if (!assignRes.body.success) {
       throw new Error(`Failed to create setup assignment: ${JSON.stringify(assignRes.body)}`);
    }
    const pastId = assignRes.body.data.id;

    // 2. "Time Travel": Manually update the deadline to the past using Prisma
    // This bypasses the controller's validation logic
    const pastDate = new Date(Date.now() - 86400000); // Yesterday
    await prisma.assignment.update({
        where: { id: pastId },
        data: { deadline: pastDate }
    });

    // 3. Attempt to submit
    const res = await request(app)
      .post(`/api/v1/classroom/${classroomId}/assignments/${pastId}/submit`)
      .set("Authorization", `Bearer ${studentToken}`)
      .field("note", "Please accept this!")
      .attach("solutions", fileBuffer, "late_solution.pdf");

    // Expect 400 Bad Request (Deadline passed)
    expect(res.status).toBeGreaterThanOrEqual(400); 
    expect(res.body.message).toMatch(/deadline|late|expired/i);
  });

  it("Step 4: Deleting assignment should remove student submissions (Cascade)", async () => {
    if (!assignmentId) throw new Error("Skipping Step 4: Assignment ID missing");

    // Delete the original assignment
    const res = await request(app)
      .delete(`/api/v1/classroom/${classroomId}/assignments/${assignmentId}`)
      .set("Authorization", `Bearer ${tutorToken}`);

    expect(res.statusCode).toBe(200);

    // Verify in DB that the Submission is gone
    const submissionCount = await prisma.submission.count({
      where: { assignmentId: assignmentId }
    });
    expect(submissionCount).toBe(0);
  });
});