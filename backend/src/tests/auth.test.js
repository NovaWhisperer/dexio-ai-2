import * as db from "./testMongodb.js"
import request from "supertest"
import app from "../app.js"
import userModel from "../models/user.model.js"
import bcrypt from "bcryptjs"

// Manual mock with factory
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
            const res1 = await request(app)
                .post('/v1/auth/register')
                .send({ fullName: { firstName: "testF", lastName: "testL" }, email: "test@gmail.com", password: "Here89#1" })
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(201)

            expect(res1.status).toBe(201)
            expect(res1.body.message).toBe("User created successfully")
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
            expect(res2.body.message).toBe("Email already exists")
        });


        it('should return 500 missing field', async () => {
            const res = await request(app)
                .post('/v1/auth/register')
                .send({ fullName: { firstName: "testF", lastName: "testL" }, password: "Here89#1" })
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(500)

            expect(res.status).toBe(500)
        });

        it('should return 500 wrong password', async () => {
            const res = await request(app)
                .post('/v1/auth/register')
                .send({ fullName: { firstName: "testF", lastName: "testL" }, email: "test@gmail.com", password: "Here891" })
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(500)

            expect(res.status).toBe(500)
        });
    });

    describe('POST /v1/auth/login', function () {

        it('return 404 user not found', async () => {

            const res1 = await request(app)
                .post('/v1/auth/login')
                .send({ email:"someotheremail@gmail.com",password:"somepass" })
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(404)

            expect(res1.status).toBe(404)
            expect(res1.body.message).toBe("User not found")
        });

        it('return 400 user found but not verified', async () => {

            const user = await userModel.create({
                fullName: { firstName: "testF", lastName: "testL" },
                email: "testregister@gmail.com",
                password: await bcrypt.hash("Here89#1", 10),
            })

            const res1 = await request(app)
                .post('/v1/auth/login')
                .send({ email: user.email, password: "Here89#1" })
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(400)

            expect(res1.status).toBe(400)
            expect(res1.body.message).toBe("User not registered")
        });

        it('return 400 password does not match', async () => {

            const user = await userModel.create({
                fullName: { firstName: "testF", lastName: "testL" },
                email: "testregister@gmail.com",
                password: await bcrypt.hash("Here89#1", 10),
                verified:true
            })

            const res1 = await request(app)
                .post('/v1/auth/login')
                .send({ email: "testregister@gmail.com", password: "Wrong89#1" })
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(400)

            expect(res1.status).toBe(400)
            expect(res1.body.message).toBe("Invalid password")
        });

        it('return 200 everything correct', async () => {

            const user = await userModel.create({
                fullName: { firstName: "testF", lastName: "testL" },
                email: "testregister@gmail.com",
                password: await bcrypt.hash("Here89#1", 10),
                verified: true
            })

            const res1 = await request(app)
                .post('/v1/auth/login')
                .send({ email: user.email, password: "Here89#1" })
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200)

            expect(res1.status).toBe(200)
            expect(res1.body.message).toBe("User login successfully")
        });

    })
})


