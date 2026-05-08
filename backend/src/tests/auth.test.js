import * as db from "./testMongodb.js"
import request from "supertest"
import app from "../app.js"
import userModel from "../models/user.model.js"
import bcrypt from "bcryptjs"
import { JWT_SECRET } from "../../config/index.js"
import jwt from "jsonwebtoken"
import crypto from "crypto"

jest.mock("../services/email.service.js", () => ({
    __esModule: true,
    default: jest.fn(),
}));

beforeAll(async () => {
    await db.connect()
})

afterEach(async () => {
    await db.clear()
})

afterAll(async () => {
    await db.disconnect()
})

describe("Auth Routes", () => {
    describe('POST /v1/auth/register', function () {
        it('should return 201 register user', async () => {
            const res = await request(app)
                .post('/v1/auth/register')
                .send({ fullName: { firstName: "testF", lastName: "testL" }, email: "test@gmail.com", password: "Here89#1" })
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(201)

            expect(res.status).toBe(201)
            expect(res.body.data.message).toBe("User created successfully")
        });

        it('should return 409 email exists', async () => {
            const res1 = await request(app)
                .post('/v1/auth/register')
                .send({ fullName: { firstName: "testF", lastName: "testL" }, email: "test@gmail.com", password: "Here89#1" })
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(201)

            const res2 = await request(app)
                .post('/v1/auth/register')
                .send({ fullName: { firstName: "testF", lastName: "testL" }, email: "test@gmail.com", password: "Here89#1" })
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(409)

            expect(res2.status).toBe(409)
            expect(res2.body.error).toBe("Email already exists")
        });


        it('should return 400 missing field', async () => {
            const res = await request(app)
                .post('/v1/auth/register')
                .send({ fullName: { firstName: "testF", lastName: "testL" }, password: "Here89#1" })
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(400)

            expect(res.status).toBe(400)
        });

        it('should return 400 wrong password', async () => {
            const res = await request(app)
                .post('/v1/auth/register')
                .send({ fullName: { firstName: "testF", lastName: "testL" }, email: "test@gmail.com", password: "Here891" })
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(400)

            expect(res.status).toBe(400)
        });
    });

    describe('POST /v1/auth/login', function () {

        it('return 404 user not found', async () => {

            const res = await request(app)
                .post('/v1/auth/login')
                .send({ email: "someotheremail@gmail.com", password: "somepass" })
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(404)

            expect(res.status).toBe(404)
            expect(res.body.error).toBe("User not found")
        });

        it('return 400 user found but not verified', async () => {

            const user = await userModel.create({
                fullName: { firstName: "testF", lastName: "testL" },
                email: "testregister@gmail.com",
                password: await bcrypt.hash("Here89#1", 10),
            })

            const res = await request(app)
                .post('/v1/auth/login')
                .send({ email: user.email, password: "Here89#1" })
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(400)

            expect(res.status).toBe(400)
            expect(res.body.error).toBe("User not registered")
        });

        it('return 400 password does not match', async () => {

            const user = await userModel.create({
                fullName: { firstName: "testF", lastName: "testL" },
                email: "testregister@gmail.com",
                password: await bcrypt.hash("Here89#1", 10),
                verified: true
            })

            const res = await request(app)
                .post('/v1/auth/login')
                .send({ email: "testregister@gmail.com", password: "Wrong89#1" })
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(400)

            expect(res.status).toBe(400)
            expect(res.body.error).toBe("Invalid password")
        });

        it('return 200 user login', async () => {

            const user = await userModel.create({
                fullName: { firstName: "testF", lastName: "testL" },
                email: "testregister@gmail.com",
                password: await bcrypt.hash("Here89#1", 10),
                verified: true
            })

            const res = await request(app)
                .post('/v1/auth/login')
                .send({ email: user.email, password: "Here89#1" })
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200)

            expect(res.status).toBe(200)
            expect(res.body.data.message).toBe("User login successfully")
        });

    })

    describe('GET /v1/auth/verify-email', function () {

        it('return 400 token not found', async () => {
            const res = await request(app)
                .get('/v1/auth/verify-email')
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(400)

            expect(res.status).toBe(400)
            expect(res.body.error).toBe("Token not found")
        });

        it('return 404 invalid token', async () => {

            const user = await userModel.create({
                fullName: { firstName: "testF", lastName: "testL" },
                email: "testregister@gmail.com",
                password: await bcrypt.hash("Here89#1", 10),
                verified: false,
                verificationTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
                verificationToken: "testtoken123"
            })

            const res = await request(app)
                .get('/v1/auth/verify-email')
                .query({ token: "wrongtoken123" })
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(404)

            expect(res.status).toBe(404)
            expect(res.body.error).toBe("Invalid Token")
        });

        it('return 400 verified true', async () => {
            const user = await userModel.create({
                fullName: { firstName: "testF", lastName: "testL" },
                email: "testregister@gmail.com",
                password: await bcrypt.hash("Here89#1", 10),
                verified: true,
                verificationTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
                verificationToken: "testtoken123"
            })

            const res = await request(app)
                .get('/v1/auth/verify-email')
                .query({ token: "testtoken123" })
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(400)

            expect(res.status).toBe(400)
            expect(res.body.data.message).toBe("User already verified")
        });

        it('return 200 user verified', async () => {

            const user = await userModel.create({
                fullName: { firstName: "testF", lastName: "testL" },
                email: "testregister@gmail.com",
                password: await bcrypt.hash("Here89#1", 10),
                verified: false,
                verificationTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
                verificationToken: "testtoken123"
            })

            const res = await request(app)
                .get('/v1/auth/verify-email')
                .query({ token: "testtoken123" })
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200)

            expect(res.status).toBe(200)
            expect(res.body.data.message).toBe("User email verified successfully")
        });

        it('return 400 invalid token', async () => {

            const user = await userModel.create({
                fullName: { firstName: "testF", lastName: "testL" },
                email: "testregister@gmail.com",
                password: await bcrypt.hash("Here89#1", 10),
                verified: false,
                verificationTokenExpiry: new Date(Date.now() - 24 * 60 * 60 * 1000),
                verificationToken: "testtoken123"
            })

            const res = await request(app)
                .get('/v1/auth/verify-email')
                .query({ token: "testtoken123" })
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(400)

            expect(res.status).toBe(400)
            expect(res.body.error).toBe("Token had expired. Register again")
        });
    })

    describe('POST /v1/auth/logout', function () {
        it('return 200 user logout', async () => {
            const user = await userModel.create({
                fullName: { firstName: "testF", lastName: "testL" },
                email: "testregister@gmail.com",
                password: await bcrypt.hash("Here89#1", 10),
                role: "user"
            })

            const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: "7d" })

            const res = await request(app)
                .post('/v1/auth/logout')
                .send({ email: user.email, password: "Here89#1" })
                .set('Cookie', `token=${token}`)
                .expect('Content-Type', /json/)
                .expect(200)

            expect(res.status).toBe(200)
            expect(res.body.data.message).toBe("User logout successfully")
        });

        it('return 401 for no cookie', async () => {
            const res = await request(app)
                .post('/v1/auth/logout')
                .expect('Content-Type', /json/)
                .expect(401)

            expect(res.status).toBe(401)
        });
    });

    describe('POST /v1/auth/forgot-password', function () {
        it('should return 200 user not found', async () => {
            const res = await request(app)
                .post('/v1/auth/forgot-password')
                .send({ email: "testnotfound@gmail.com" })
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200)

            expect(res.status).toBe(200)
            expect(res.body.data.message).toBe("Password reset link sent successfully")
        });

        it('should return 200 forget password link send successfully', async () => {

            const user = await userModel.create({
                fullName: { firstName: "testF", lastName: "testL" },
                email: "test@gmail.com",
                password: await bcrypt.hash("Here89#1", 10)
            })

            const res = await request(app)
                .post('/v1/auth/forgot-password')
                .send({ email: "test@gmail.com" })
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200)

            expect(res.status).toBe(200)
            expect(res.body.data.message).toBe("Password reset link sent successfully")
        });

    });

    describe('POST /v1/auth/reset-password', function () {
        it('should return 400 invalid token', async () => {
            const res = await request(app)
                .post('/v1/auth/reset-password')
                .send({ password: "resetpass123" })
                .query({ token: "wrongtoken123" })
                .expect('Content-Type', /json/)
                .expect(400)

            expect(res.status).toBe(400)
            expect(res.body.error).toBe("Invalid token")
        });

        it('should return 400 reset expiry time exceeded ', async () => {
            const user = await userModel.create({
                fullName: { firstName: "testF", lastName: "testL" },
                email: "test@gmail.com",
                password: await bcrypt.hash("Here89#1", 10),
                resetToken: "resettoken",
                resetTokenExpiry: new Date(Date.now() - 24 * 60 * 60 * 1000),
            })

            const res = await request(app)
                .post('/v1/auth/reset-password')
                .send({ password: "resetpass123" })
                .query({ token: "resettoken" })
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(400)

            expect(res.status).toBe(400)
            expect(res.body.error).toBe("Reset token expired")
        });

        it('should return 200 password reset successfully', async () => {
            const user = await userModel.create({
                fullName: { firstName: "testF", lastName: "testL" },
                email: "test@gmail.com",
                password: await bcrypt.hash("Here89#1", 10),
                resetToken: "resettoken",
                resetTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),

            })

            const res = await request(app)
                .post('/v1/auth/reset-password')
                .send({ password: "resetpass123" })
                .query({ token: "resettoken" })
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200)

            expect(res.status).toBe(200)
            expect(res.body.data.message).toBe("Password reset successfully")
        });
    });
})


