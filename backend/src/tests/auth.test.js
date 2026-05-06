import * as db from "./testMongodb.js"
import request from "supertest"
import app from "../app.js"


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
        it('should register a new user', async () => {
            const res1 = await request(app)
                .post('/v1/auth/register')
                .send({ fullName: { firstName: "testF", lastName: "testL" }, email: "test@gmail.com", password: "Here89#1" })
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(201)

            expect(res1.status).toBe(201)
            expect(res1.body.message).toBe("User created successfully")
        });


        it('should return 409', async () => {
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
})
