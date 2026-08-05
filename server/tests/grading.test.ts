import { clearDatabase } from "./setup.ts";
import request from "supertest";
import app from "../src/app.ts";
import { prisma } from "../src/configs/database.config.ts";

let tutorToken: string;
let studentToken: string;
let classroomId: string;
let paperId: string;

describe("Grading Engine & Question Management", () => {
  beforeAll(async () => {
    await clearDatabase();

    // 1. Register & Verify Tutor
    await request(app).post("/api/v1/auth/register").send({
      fullName: "Grading Tutor", 
      email: "gtutor@test.com", 
      password: "Password@123", 
      accountType: "TUTOR"
    });
    
    // Manually verify tutor in DB by creating a verified TutorApplication
    const tutor = await prisma.user.findUniqueOrThrow({ where: { email: "gtutor@test.com" } });
    await prisma.tutorApplication.create({
      data: { userId: tutor.id, status: "VERIFIED", documentUrl: "test-doc.pdf" }
    });

    const tLogin = await request(app).post("/api/v1/auth/login").send({ 
      email: "gtutor@test.com", 
      password: "Password@123" 
    });
    tutorToken = tLogin.body.data.accessToken;

    // 2. Register Student
    const sReg = await request(app).post("/api/v1/auth/register").send({
      fullName: "Grading Student", 
      email: "gstudent@test.com", 
      password: "Password@123", 
      accountType: "STUDENT"
    });
    const studentId = sReg.body.data.id;

    const sLogin = await request(app).post("/api/v1/auth/login").send({ 
      email: "gstudent@test.com", 
      password: "Password@123" 
    });
    studentToken = sLogin.body.data.accessToken;

    // 3. Create Classroom
    const cls = await request(app)
      .post("/api/v1/classroom")
      .set("Authorization", `Bearer ${tutorToken}`)
      .send({ name: "Math Class", subject: "Arithmetic", batch: "2026" });
    classroomId = cls.body.data.id;

    // 4. Join Student and MANUALLY APPROVE (Bypasses "PENDING" restriction)
    await request(app)
      .post("/api/v1/classroom/join")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ joiningCode: cls.body.data.joiningCode });
    
    await prisma.classroomMember.update({
      where: { userId_classroomId: { userId: studentId, classroomId: classroomId } },
      data: { membershipStatus: "APPROVED" }
    });

    // 5. Create Paper (Schedule in future to pass creation validation)
    const paper = await request(app)
      .post(`/api/v1/classroom/${classroomId}/papers`)
      .set("Authorization", `Bearer ${tutorToken}`)
      .send({ 
        title: "Unit Test", 
        duration: "30", 
        liveAt: new Date(Date.now() + 600000).toISOString() 
      });

    if (!paper.body.success) {
        throw new Error(`Paper Creation Failed: ${JSON.stringify(paper.body)}`);
    }
    paperId = paper.body.data.id;

    // 6. Set Paper to LIVE (Required to start an OFFICIAL attempt)
    await request(app)
      .patch(`/api/v1/classroom/${classroomId}/papers/${paperId}/status`)
      .set("Authorization", `Bearer ${tutorToken}`)
      .send({ status: "LIVE" });
  });

  it("Step 1: Add MCQ, MSQ, and NAT questions to the paper", async () => {
    // Add MCQ (Correct: 4)
    await request(app)
      .post(`/api/v1/classroom/${classroomId}/papers/${paperId}/questions`)
      .set("Authorization", `Bearer ${tutorToken}`)
      .send({ 
        text: "2+2?", 
        type: "MCQ", 
        marks: 2, 
        options: [
            { text: "4", isCorrect: true }, 
            { text: "5", isCorrect: false }
        ] 
      });

    // Add NAT (Correct: 10.5)
    await request(app)
      .post(`/api/v1/classroom/${classroomId}/papers/${paperId}/questions`)
      .set("Authorization", `Bearer ${tutorToken}`)
      .send({ 
        text: "5.25 * 2?", 
        type: "NAT", 
        marks: 3, 
        numericalCorrectAnswer: 10.5 
      });

    // Add MSQ (Correct: 7 and 11)
    const res = await request(app)
      .post(`/api/v1/classroom/${classroomId}/papers/${paperId}/questions`)
      .set("Authorization", `Bearer ${tutorToken}`)
      .send({ 
        text: "Select prime numbers", 
        type: "MSQ", 
        marks: 5, 
        options: [
            { text: "4", isCorrect: false }, 
            { text: "7", isCorrect: true }, 
            { text: "11", isCorrect: true }
        ] 
      });

    expect(res.statusCode).toBe(201);
  });

  it("Step 2: Student completes attempt and checks automated grading", async () => {
    // Start attempt
    const attemptRes = await request(app)
      .post(`/api/v1/classroom/${classroomId}/papers/${paperId}/attempts`)
      .set("Authorization", `Bearer ${studentToken}`);

    // Robust error check for Step 2
    if (!attemptRes.body || !attemptRes.body.success) {
        console.error("FAILED TO START ATTEMPT:", attemptRes.status, attemptRes.body);
        throw new Error(`Test Attempt Start failed: ${attemptRes.body?.message}`);
    }

    const attemptId = attemptRes.body.data.id;

    // Get questions with IDs
    const paperDetails = await request(app)
      .get(`/api/v1/classroom/${classroomId}/papers/${paperId}`)
      .set("Authorization", `Bearer ${tutorToken}`);
    const questions = paperDetails.body.data.questions;

    // Submit Answers: Correct for all types
    for (const q of questions) {
      let payload: any = { questionId: q.id };
      
      if (q.type === "MCQ") {
        payload.selectedOptionId = q.options.find((o: any) => o.text === "4").id;
      } else if (q.type === "NAT") {
        payload.numericalAnswer = 10.5;
      } else if (q.type === "MSQ") {
        payload.selectedOptionId = q.options.filter((o: any) => o.isCorrect).map((o: any) => o.id);
      }

      await request(app)
        .post(`/api/v1/classroom/${classroomId}/papers/${paperId}/attempts/${attemptId}/answers`)
        .set("Authorization", `Bearer ${studentToken}`)
        .send(payload);
    }

    // Final Submission
    const finalRes = await request(app)
      .post(`/api/v1/classroom/${classroomId}/papers/${paperId}/attempts/${attemptId}/submit`)
      .set("Authorization", `Bearer ${studentToken}`);

    // Assert total marks: 2 (MCQ) + 3 (NAT) + 5 (MSQ) = 10
    expect(finalRes.body.data.score).toBe(10);
  });
});