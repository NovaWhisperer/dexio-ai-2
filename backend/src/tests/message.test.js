import * as db from "./testMongodb.js"
import request from "supertest"
import app from "../app.js"
import userModel from "../models/user.model.js"
import bcrypt from "bcryptjs"
import { JWT_SECRET } from "../../config/index.js"
import jwt from "jsonwebtoken"
import chatModel from "../models/chat.model.js"
import mongoose from "mongoose"
import messageModel from "../models/message.model.js"
import { generateChatTitle, generateResponse } from "../services/ai.service.js"
import { createEmbedding } from "../services/vector.service.js"


jest.mock("../services/ai.service.js", () => ({
    __esModule: true,
    generateResponse: jest.fn(),
    generateChatTitle: jest.fn(),
}));

jest.mock("../services/vector.service.js", () => ({
    __esModule: true,
    createEmbedding: jest.fn(),
}));


let token = null
let id = null

beforeAll(async () => {
    await db.connect()

    const user = await userModel.create({
        fullName: { firstName: "testF", lastName: "testL" },
        email: "testregister@gmail.com",
        password: await bcrypt.hash("Here89#1", 10),
        role: "user"
    })

    id = user._id
    token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: "7d" })
})

afterEach(async () => {
    await db.clear()
})

beforeEach(async () => {
    generateResponse.mockResolvedValue("This is a mock AI response")
    generateChatTitle.mockResolvedValue("Mock Chat Title")
    createEmbedding.mockResolvedValue([])
})

afterAll(async () => {
    await db.disconnect()
})

describe("Message Routes", () => {

    describe('POST /v1/message/create', function () {
        it('return 201 message created', async () => {
            const chats = await chatModel.create({ userId: id })

            const chatId = chats._id

            const res = await request(app)
                .post('/v1/message/create')
                .send({ chatId, messageContent: "Hello, how are you" })
                .set('Cookie', `token=${token}`)
                .expect('Content-Type', /json/)
                .expect(201)

            expect(res.body.data.response).toBe("This is a mock AI response")
            expect(res.body.data.message).toBe("Message created successfully")
        });

        it('return 404 chat not found', async () => {
            const fakeId = new mongoose.Types.ObjectId();

            const res = await request(app)
                .post('/v1/message/create')
                .send({ chatId: fakeId, messageContent: "Hello, how are you" })
                .set('Cookie', `token=${token}`)
                .expect('Content-Type', /json/)
                .expect(404)

            expect(res.body.error).toBe("Chat not found")
        });


        it('return 401 for no cookie', async () => {
            const res = await request(app)
                .post('/v1/message/create')
                .expect('Content-Type', /json/)

            expect(res.status).toBe(401)
        });
    });

    describe('GET /v1/message/read/:chatId', function () {
        it('return 200 message created', async () => {
            const chats = await chatModel.create({ userId: id })

            const chatId = chats._id

            const messages = await messageModel.create({ chatId, messageContent: "message 1" })

            const res = await request(app)
                .get(`/v1/message/read/${chatId}`)
                .set('Cookie', `token=${token}`)
                .expect('Content-Type', /json/)
                .expect(200)

            expect((res.body.data.messages).length).toBe(1)
            expect(res.body.data.message).toBe("Messages fetched successfully")
        });

        it('return 404 chat not found', async () => {
            const fakeId = new mongoose.Types.ObjectId();

            const res = await request(app)
                .get(`/v1/message/read/${fakeId}`)
                .set('Cookie', `token=${token}`)
                .expect('Content-Type', /json/)
                .expect(404)

            expect(res.body.error).toBe("Chat not found")
        });

        it('return 401 for no cookie', async () => {
            const fakeId = new mongoose.Types.ObjectId();

            const res = await request(app)
                .get(`/v1/message/read/${fakeId}`)
                .expect('Content-Type', /json/)

            expect(res.status).toBe(401)
        });
    });

    describe('PATCH /v1/message/update/:id', function () {
        it('return 200 message created', async () => {
            const chats = await chatModel.create({ userId: id })

            const chatId = chats._id

            const messages = await messageModel.create({ chatId, messageContent: "message 1" })

            const res = await request(app)
                .patch(`/v1/message/update/${messages._id}`)
                .send({ chatId, messageContent: "message changed" })
                .set('Cookie', `token=${token}`)
                .expect('Content-Type', /json/)
                .expect(200)

            expect(res.body.data.message).toBe("Message updated successfully")
        });

        it('return 404 chat not found', async () => {
            const fakeId = new mongoose.Types.ObjectId();

            const res = await request(app)
                .patch(`/v1/message/update/${fakeId}`)
                .send({ fakeId, messageContent: "message changed" })
                .set('Cookie', `token=${token}`)
                .expect('Content-Type', /json/)
                .expect(404)

            expect(res.body.error).toBe("Message not found")
        });

        it('return 401 for no cookie', async () => {
            const fakeId = new mongoose.Types.ObjectId();

            const res = await request(app)
                .patch(`/v1/message/update/${fakeId}`)
                .expect('Content-Type', /json/)

            expect(res.status).toBe(401)
        });
    });

    describe('DELETE /v1/message/delete/:id', function () {
        it('return 200 message created', async () => {
            const chats = await chatModel.create({ userId: id })

            const chatId = chats._id

            const messages = await messageModel.create({ chatId, messageContent: "message 1" })

            const res = await request(app)
                .delete(`/v1/message/delete/${messages._id}`)
                .send({ chatId })
                .set('Cookie', `token=${token}`)
                .expect('Content-Type', /json/)
                .expect(200)

            expect(res.body.data.message).toBe("Message deleted successfully")
        });

        it('return 404 chat not found', async () => {
            const fakeId = new mongoose.Types.ObjectId();

            const res = await request(app)
                .delete(`/v1/message/delete/${fakeId}`)
                .send({ fakeId })
                .set('Cookie', `token=${token}`)
                .expect('Content-Type', /json/)
                .expect(404)

            expect(res.body.error).toBe("Message not found")
        });

        it('return 401 for no cookie', async () => {
            const fakeId = new mongoose.Types.ObjectId();

            const res = await request(app)
                .delete(`/v1/message/delete/${fakeId}`)
                .expect('Content-Type', /json/)

            expect(res.status).toBe(401)
        });
    });

})