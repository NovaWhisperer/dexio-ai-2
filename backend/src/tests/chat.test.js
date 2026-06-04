import * as db from "./testMongodb.js"
import request from "supertest"
import app from "../app.js"
import userModel from "../models/user.model.js"
import bcrypt from "bcryptjs"
import { JWT_SECRET } from "../../config/index.js"
import jwt from "jsonwebtoken"
import chatModel from "../models/chat.model.js"
import mongoose from "mongoose"
import crypto from "crypto"
import { client } from "../db/redis.js"
import userAnalyticsModel from "../models/userAnalytics.model.js"

const TEST_PASSWORD = crypto.randomBytes(12).toString("hex")

const TEST_USER = {
    fullName: { firstName: "Test", lastName: "User" },
    email: "test.user@example.com",
    password: TEST_PASSWORD
}

jest.mock("../db/redis.js", () => ({
    __esModule: true,
    client: {
        exists: jest.fn(),
    }
}));

let token = null
let id = null

beforeAll(async () => {
    await db.connect()

    const user = await userModel.create({
        fullName: TEST_USER.fullName,
        email: TEST_USER.email,
        password: await bcrypt.hash(TEST_PASSWORD, 10),
        role: "user"
    })

    id = user._id
    token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: "7d" })

    client.exists.mockResolvedValue(0)
})

afterEach(async () => {
    await db.clear()
})

afterAll(async () => {
    await db.disconnect()
})


describe("Chat Routes", () => {

    describe('POST /v1/chat/create', function () {
        it('return 201 chat created', async () => {
            const res = await request(app)
                .post('/v1/chat/create')
                .set('Cookie', `token=${token}`)
                .expect('Content-Type', /json/)
                .expect(201)

            expect(res.body.data.message).toBe("Chat created successfully")
        });

        it('return 401 for no cookie', async () => {
            const res = await request(app)
                .post('/v1/chat/create')
                .expect('Content-Type', /json/)

            expect(res.status).toBe(401)
        });

        it('should update userAnalytics document on chat Creation', async () => {
            await userAnalyticsModel.create({ userId: id })

            const res = await request(app)
                .post('/v1/chat/create')
                .set('Cookie', `token=${token}`)
                .expect('Content-Type', /json/)
                .expect(201)

            const userAnalytics = await userAnalyticsModel.findOne({ userId: id })

            expect(userAnalytics.chatCount).toBe(1)
        });
    });

    describe('GET /v1/chat/read', function () {
        it('return 200 chat read', async () => {
            const chats = await chatModel.create({ userId: id })

            const res = await request(app)
                .get('/v1/chat/read')
                .set('Cookie', `token=${token}`)
                .expect('Content-Type', /json/)
                .expect(200)

            expect((res.body.data.chats).length).toBe(1)
            expect(res.body.data.message).toBe("Chats fetched successfully")
        });

        it('return 401 for no cookie', async () => {
            const res = await request(app)
                .get('/v1/chat/read')
                .expect('Content-Type', /json/)

            expect(res.status).toBe(401)
        });
    });

    describe('PATCH /v1/chat/update/:id', function () {
        it('return 200 chat name updated', async () => {
            const chats = await chatModel.create({ userId: id })

            const res = await request(app)
                .patch(`/v1/chat/update/${chats._id}`)
                .send({ chatName: "Changed chatName" })
                .set('Cookie', `token=${token}`)
                .expect('Content-Type', /json/)
                .expect(200)

            expect(res.body.data.message).toBe("Chat name updated successfully")
        });

        it('return 400 chatId is wrong', async () => {
            const fakeId = new mongoose.Types.ObjectId();

            const res = await request(app)
                .patch(`/v1/chat/update/${fakeId}`)
                .send({ chatName: "Changed chatName" })
                .set('Cookie', `token=${token}`)
                .expect('Content-Type', /json/)
                .expect(400)

            expect(res.body.error).toBe("ChatId is wrong")
        });

        it('return 401 for no cookie', async () => {
            const fakeId = new mongoose.Types.ObjectId();

            const res = await request(app)
                .patch(`/v1/chat/update/${fakeId}`)
                .expect('Content-Type', /json/)

            expect(res.status).toBe(401)
        });
    });

    describe('DELETE /v1/chat/delete/:id', function () {
        it('return 200 deleted', async () => {
            const chats = await chatModel.create({ userId: id })

            const res = await request(app)
                .delete(`/v1/chat/delete/${chats._id}`)
                .set('Cookie', `token=${token}`)
                .expect('Content-Type', /json/)
                .expect(200)

            expect(res.body.data.message).toBe("Chat deleted successfully")
        });

        it('return 400 chatId is wrong', async () => {
            const fakeId = new mongoose.Types.ObjectId();

            const res = await request(app)
                .delete(`/v1/chat/delete/${fakeId}`)
                .set('Cookie', `token=${token}`)
                .expect('Content-Type', /json/)
                .expect(400)

            expect(res.body.error).toBe("ChatId is wrong")
        });

        it('return 401 for no cookie', async () => {
            const fakeId = new mongoose.Types.ObjectId();

            const res = await request(app)
                .delete(`/v1/chat/delete/${fakeId}`)
                .expect('Content-Type', /json/)

            expect(res.status).toBe(401)
        });
    });
})