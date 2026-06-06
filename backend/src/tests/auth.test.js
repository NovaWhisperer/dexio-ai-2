import * as db from "./testMongodb.js";
import request from "supertest";
import app from "../app.js";
import userModel from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { JWT_SECRET } from "../../config/index.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { client } from "../db/redis.js";
import userAnalyticsModel from "../models/userAnalytics.model.js";

const TEST_PASSWORD = crypto.randomBytes(12).toString("hex");
const WRONG_PASSWORD = crypto.randomBytes(12).toString("hex");
const SHORT_PASSWORD = crypto.randomBytes(2).toString("hex");
const TEST_EMAIL = `test.${crypto.randomBytes(4).toString("hex")}@example.com`;
const NOT_FOUND_EMAIL = `notfound.${crypto.randomBytes(4).toString("hex")}@example.com`;

const TEST_USER = {
  fullName: { firstName: "Test", lastName: "User" },
  email: TEST_EMAIL,
  password: TEST_PASSWORD,
};

jest.mock("../services/email.service.js", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("../db/redis.js", () => ({
  __esModule: true,
  client: {
    exists: jest.fn(),
    set: jest.fn(),
  },
}));

beforeAll(async () => {
  await db.connect();
  client.exists.mockResolvedValue(0);
});

afterEach(async () => {
  await db.clear();
});

afterAll(async () => {
  await db.disconnect();
});

describe("Auth Routes", () => {
  describe("POST /v1/auth/register", function () {
    it("should return 201 register user", async () => {
      const res = await request(app)
        .post("/v1/auth/register")
        .send({
          fullName: TEST_USER.fullName,
          email: TEST_USER.email,
          password: TEST_PASSWORD,
        })
        .set("Accept", "application/json")
        .expect("Content-Type", /json/)
        .expect(201);

      expect(res.body.data.message).toBe("User created successfully");
    });

    it("should return 409 email exists", async () => {
      await request(app)
        .post("/v1/auth/register")
        .send({
          fullName: TEST_USER.fullName,
          email: TEST_USER.email,
          password: TEST_PASSWORD,
        })
        .set("Accept", "application/json")
        .expect(201);

      const res2 = await request(app)
        .post("/v1/auth/register")
        .send({
          fullName: TEST_USER.fullName,
          email: TEST_USER.email,
          password: TEST_PASSWORD,
        })
        .set("Accept", "application/json")
        .expect("Content-Type", /json/)
        .expect(409);

      expect(res2.body.error).toBe("Email already exists");
    });

    it("should return 400 missing field", async () => {
      const res = await request(app)
        .post("/v1/auth/register")
        .send({ fullName: TEST_USER.fullName, password: TEST_PASSWORD })
        .set("Accept", "application/json")
        .expect("Content-Type", /json/)
        .expect(400);
    });

    it("should return 400 wrong password format", async () => {
      const res = await request(app)
        .post("/v1/auth/register")
        .send({
          fullName: TEST_USER.fullName,
          email: TEST_USER.email,
          password: SHORT_PASSWORD,
        })
        .set("Accept", "application/json")
        .expect("Content-Type", /json/)
        .expect(400);
    });

    it("should create userAnalytics document on registration", async () => {
      const res = await request(app)
        .post("/v1/auth/register")
        .send({
          fullName: TEST_USER.fullName,
          email: TEST_USER.email,
          password: TEST_PASSWORD,
        })
        .set("Accept", "application/json")
        .expect("Content-Type", /json/)
        .expect(201);

      const user = await userModel.findOne({ email: TEST_USER.email });
      const userId = user._id;

      const userAnalytics = await userAnalyticsModel.findOne({ userId });

      expect(userAnalytics.chatCount).toBe(0);
      expect(userAnalytics.messageCount).toBe(0);
    });
  });

  describe("POST /v1/auth/login", function () {
    it("return 404 user not found", async () => {
      const res = await request(app)
        .post("/v1/auth/login")
        .send({ email: NOT_FOUND_EMAIL, password: TEST_PASSWORD })
        .set("Accept", "application/json")
        .expect("Content-Type", /json/)
        .expect(404);

      expect(res.body.error).toBe("User not found");
    });

    it("return 400 user found but not verified", async () => {
      const user = await userModel.create({
        fullName: TEST_USER.fullName,
        email: TEST_USER.email,
        password: await bcrypt.hash(TEST_PASSWORD, 10),
      });

      const res = await request(app)
        .post("/v1/auth/login")
        .send({ email: user.email, password: TEST_PASSWORD })
        .set("Accept", "application/json")
        .expect("Content-Type", /json/)
        .expect(400);

      expect(res.body.error).toBe("User not registered");
    });

    it("return 400 password does not match", async () => {
      await userModel.create({
        fullName: TEST_USER.fullName,
        email: TEST_USER.email,
        password: await bcrypt.hash(TEST_PASSWORD, 10),
        verified: true,
      });

      const res = await request(app)
        .post("/v1/auth/login")
        .send({ email: TEST_USER.email, password: WRONG_PASSWORD })
        .set("Accept", "application/json")
        .expect("Content-Type", /json/)
        .expect(400);

      expect(res.body.error).toBe("Invalid password");
    });

    it("return 200 user login", async () => {
      const user = await userModel.create({
        fullName: TEST_USER.fullName,
        email: TEST_USER.email,
        password: await bcrypt.hash(TEST_PASSWORD, 10),
        verified: true,
      });

      const res = await request(app)
        .post("/v1/auth/login")
        .send({ email: user.email, password: TEST_PASSWORD })
        .set("Accept", "application/json")
        .expect("Content-Type", /json/)
        .expect(200);

      expect(res.body.data.message).toBe("User login successfully");
    });
  });

  describe("GET /v1/auth/verify-email", function () {
    it("return 400 token not found", async () => {
      const res = await request(app)
        .get("/v1/auth/verify-email")
        .set("Accept", "application/json")
        .expect("Content-Type", /json/)
        .expect(400);

      expect(res.body.error).toBe("Token not found");
    });

    it("return 404 invalid token", async () => {
      await userModel.create({
        fullName: TEST_USER.fullName,
        email: TEST_USER.email,
        password: await bcrypt.hash(TEST_PASSWORD, 10),
        verified: false,
        verificationTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
        verificationToken: "validtesttoken",
      });

      const res = await request(app)
        .get("/v1/auth/verify-email")
        .query({ token: "wrongtesttoken" })
        .set("Accept", "application/json")
        .expect("Content-Type", /json/)
        .expect(404);

      expect(res.body.error).toBe("Invalid Token");
    });

    it("return 200 user already verified", async () => {
      await userModel.create({
        fullName: TEST_USER.fullName,
        email: TEST_USER.email,
        password: await bcrypt.hash(TEST_PASSWORD, 10),
        verified: true,
        verificationTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
        verificationToken: "validtesttoken",
      });

      const res = await request(app)
        .get("/v1/auth/verify-email")
        .query({ token: "validtesttoken" })
        .set("Accept", "application/json")
        .expect("Content-Type", /json/)
        .expect(200);

      expect(res.body.data.message).toBe("User already verified");
    });

    it("return 200 user verified", async () => {
      await userModel.create({
        fullName: TEST_USER.fullName,
        email: TEST_USER.email,
        password: await bcrypt.hash(TEST_PASSWORD, 10),
        verified: false,
        verificationTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
        verificationToken: "validtesttoken",
      });

      const res = await request(app)
        .get("/v1/auth/verify-email")
        .query({ token: "validtesttoken" })
        .set("Accept", "application/json")
        .expect("Content-Type", /json/)
        .expect(200);

      expect(res.body.data.message).toBe("User email verified successfully");
    });

    it("return 400 token expired", async () => {
      await userModel.create({
        fullName: TEST_USER.fullName,
        email: TEST_USER.email,
        password: await bcrypt.hash(TEST_PASSWORD, 10),
        verified: false,
        verificationTokenExpiry: new Date(Date.now() - 24 * 60 * 60 * 1000),
        verificationToken: "validtesttoken",
      });

      const res = await request(app)
        .get("/v1/auth/verify-email")
        .query({ token: "validtesttoken" })
        .set("Accept", "application/json")
        .expect("Content-Type", /json/)
        .expect(400);

      expect(res.body.error).toBe("Token had expired. Register again");
    });
  });

  describe("POST /v1/auth/logout", function () {
    it("return 200 user logout", async () => {
      const user = await userModel.create({
        fullName: TEST_USER.fullName,
        email: TEST_USER.email,
        password: await bcrypt.hash(TEST_PASSWORD, 10),
        role: "user",
      });

      const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, {
        expiresIn: "7d",
      });

      const res = await request(app)
        .post("/v1/auth/logout")
        .set("Cookie", `token=${token}`)
        .expect("Content-Type", /json/)
        .expect(200);

      expect(res.body.data.message).toBe("User logout successfully");
    });

    it("return 401 token blacklisted", async () => {
      client.exists.mockResolvedValue(1);

      const user = await userModel.create({
        fullName: TEST_USER.fullName,
        email: TEST_USER.email,
        password: await bcrypt.hash(TEST_PASSWORD, 10),
        role: "user",
      });

      const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, {
        expiresIn: "7d",
      });

      const res = await request(app)
        .get("/v1/chat/read")
        .set("Cookie", `token=${token}`)
        .expect("Content-Type", /json/)
        .expect(401);
    });

    it("return 401 for no cookie", async () => {
      const res = await request(app)
        .post("/v1/auth/logout")
        .expect("Content-Type", /json/)
        .expect(401);
    });
  });

  describe("POST /v1/auth/forgot-password", function () {
    it("should return 200 user not found", async () => {
      const res = await request(app)
        .post("/v1/auth/forgot-password")
        .send({ email: NOT_FOUND_EMAIL })
        .set("Accept", "application/json")
        .expect("Content-Type", /json/)
        .expect(200);

      expect(res.body.data.message).toBe(
        "Password reset link sent successfully",
      );
    });

    it("should return 200 forgot password link sent successfully", async () => {
      await userModel.create({
        fullName: TEST_USER.fullName,
        email: TEST_USER.email,
        password: await bcrypt.hash(TEST_PASSWORD, 10),
      });

      const res = await request(app)
        .post("/v1/auth/forgot-password")
        .send({ email: TEST_USER.email })
        .set("Accept", "application/json")
        .expect("Content-Type", /json/)
        .expect(200);

      expect(res.body.data.message).toBe(
        "Password reset link sent successfully",
      );
    });
  });

  describe("POST /v1/auth/reset-password", function () {
    it("should return 400 invalid token", async () => {
      const res = await request(app)
        .post("/v1/auth/reset-password")
        .send({ password: TEST_PASSWORD })
        .query({ token: "wrongresettoken" })
        .expect("Content-Type", /json/)
        .expect(400);

      expect(res.body.error).toBe("Invalid token");
    });

    it("should return 400 reset expiry time exceeded", async () => {
      await userModel.create({
        fullName: TEST_USER.fullName,
        email: TEST_USER.email,
        password: await bcrypt.hash(TEST_PASSWORD, 10),
        resetToken: "validresettoken",
        resetTokenExpiry: new Date(Date.now() - 24 * 60 * 60 * 1000),
      });

      const res = await request(app)
        .post("/v1/auth/reset-password")
        .send({ password: WRONG_PASSWORD })
        .query({ token: "validresettoken" })
        .set("Accept", "application/json")
        .expect("Content-Type", /json/)
        .expect(400);

      expect(res.body.error).toBe("Reset token expired");
    });

    it("should return 200 password reset successfully", async () => {
      await userModel.create({
        fullName: TEST_USER.fullName,
        email: TEST_USER.email,
        password: await bcrypt.hash(TEST_PASSWORD, 10),
        resetToken: "validresettoken",
        resetTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      const res = await request(app)
        .post("/v1/auth/reset-password")
        .send({ password: WRONG_PASSWORD })
        .query({ token: "validresettoken" })
        .set("Accept", "application/json")
        .expect("Content-Type", /json/)
        .expect(200);

      expect(res.body.data.message).toBe("Password reset successfully");
    });
  });
});
