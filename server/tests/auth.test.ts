import { clearDatabase } from "./setup.js";
import request from "supertest";
import app from "../src/app.js";

describe("Authentication Module", () => {
  beforeAll(async () => {
    await clearDatabase();
  });

  const studentUser = {
    fullName: "Test Student",
    email: "student@test.com",
    password: "Password@123",
    accountType: "STUDENT",
  };

  it("POST /api/v1/auth/register - Should register a new user", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send(studentUser);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(studentUser.email);
  });

  it("POST /api/v1/auth/register - Should fail on duplicate email", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send(studentUser);

    expect(res.statusCode).toBe(409); // Conflict
  });

  it("POST /api/v1/auth/login - Should login and return tokens", async () => {
    const res = await request(app).post("/api/v1/auth/login").send({
      email: studentUser.email,
      password: studentUser.password,
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty("accessToken");
    // Check if Refresh Token cookie is set
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  it("POST /api/v1/auth/login - Should fail with wrong password", async () => {
    const res = await request(app).post("/api/v1/auth/login").send({
      email: studentUser.email,
      password: "WrongPassword!",
    });

    expect(res.statusCode).toBe(401);
  });
});
