import * as db from "./testMongodb.js";
import request from "supertest";
import app from "../app.js";
import { JWT_SECRET } from "../../config/index.js";
import jwt from "jsonwebtoken";
import userModel from "../models/user.model.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import userAnalyticsModel from "../models/userAnalytics.model.js";
import { client } from "../db/redis.js";

const TEST_PASSWORD = crypto.randomBytes(12).toString("hex");

const TEST_USER = {
  fullName: { firstName: "Test", lastName: "User" },
  email: "test.user@example.com",
  password: TEST_PASSWORD,
  role: "user",
};

const TEST_ADMIN = {
  fullName: {
    firstName: "Test",
    lastName: "Admin",
  },
  email: "test.admin@example.com",
  password: TEST_PASSWORD,
  role: "admin",
};

jest.mock("../db/redis.js", () => ({
  __esModule: true,
  client: {
    exists: jest.fn(),
  },
}));

let userId = null;
let userToken = null;

let adminId = null;
let adminToken = null;

beforeAll(async () => {
  await db.connect();

  const user = await userModel.create({
    fullName: TEST_USER.fullName,
    email: TEST_USER.email,
    password: await bcrypt.hash(TEST_PASSWORD, 10),
    role: "user",
  });

  userId = user._id;
  userToken = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, {
    expiresIn: "7d",
  });

  const admin = await userModel.create({
    fullName: TEST_ADMIN.fullName,
    email: TEST_ADMIN.email,
    password: await bcrypt.hash(TEST_PASSWORD, 10),
    role: "admin",
  });

  adminId = admin._id;
  adminToken = jwt.sign({ id: admin._id, role: admin.role }, JWT_SECRET, {
    expiresIn: "7d",
  });

  client.exists.mockResolvedValue(0);
});

afterEach(async () => {
  await db.clear();
});

afterAll(async () => {
  await db.disconnect();
});

describe("Analytics Routes", () => {
  describe("GET /v1/analytics/:userId", function () {
    it("return 401 no cookie", async () => {
      const res = await request(app)
        .get(`/v1/analytics/${userId}`)
        .expect("Content-Type", /json/)
        .expect(401);

      expect(res.body.error).toBe("Unauthorized: No token provided");
    });

    it("return 403 for Valid cookie but role is not admin", async () => {
      const res = await request(app)
        .get(`/v1/analytics/${userId}`)
        .set("Cookie", `token=${userToken}`)
        .expect("Content-Type", /json/)
        .expect(403);

      expect(res.body.error).toBe("Forbidden: Access denied");
    });

    it("return 404 Admin cookie, valid userId but no analytics document", async () => {
      const res = await request(app)
        .get(`/v1/analytics/${userId}`)
        .set("Cookie", `token=${adminToken}`)
        .expect("Content-Type", /json/)
        .expect(404);

      expect(res.body.error).toBe("User Analytics data not found");
    });

    it("return 200 Admin cookie, valid userId, analytics document exists → 200", async () => {
      await userAnalyticsModel.create({ userId: userId });

      const res = await request(app)
        .get(`/v1/analytics/${userId}`)
        .set("Cookie", `token=${adminToken}`)
        .expect("Content-Type", /json/)
        .expect(200);

      const userAnalytics = await userAnalyticsModel.findOne({
        userId: userId,
      });

      expect(userAnalytics.chatCount).toBe(0);

      expect(res.body.data.message).toBe(
        "User analytics data fetched successfully",
      );
    });
  });
});
