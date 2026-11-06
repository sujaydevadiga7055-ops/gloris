
require("dotenv").config();

process.env.JWT_SECRET =
    process.env.JWT_SECRET ||
    "jest-testing-secret-key-minimum-32-characters";

const request = require("supertest");
const express = require("express");

const app = require("../server");
const prisma = require("../lib/prisma");
const authenticateToken = require("../middleware/authenticateToken");

const testEmail = `jest_${Date.now()}@example.com`;
const testPassword = "Test@12345";

describe("Lumina User Authentication API", () => {

    beforeAll(async () => {
        await prisma.user.deleteMany({
            where: { email: testEmail }
        });
    });

    afterAll(async () => {
        await prisma.user.deleteMany({
            where: { email: testEmail }
        });

        await prisma.$disconnect();
    });

    describe("POST /api/auth/register", () => {

        test("should register a new user successfully", async () => {
            const response = await request(app)
                .post("/api/auth/register")
                .send({
                    email: testEmail,
                    password: testPassword
                });

            expect(response.status).toBe(201);
            expect(response.body.message).toBe("Registration successful");
            expect(response.body.user.email).toBe(testEmail);
            expect(response.body.user.role).toBe("STUDENT");
            expect(response.body.user).not.toHaveProperty("passwordHash");
        });

        test("should reject missing fields", async () => {
            const response = await request(app)
                .post("/api/auth/register")
                .send({});

            expect(response.status).toBe(400);
            expect(response.body.message).toBeDefined();
        });

        test("should reject invalid email", async () => {
            const response = await request(app)
                .post("/api/auth/register")
                .send({
                    email: "",
                    password: testPassword
                });

            expect(response.status).toBe(400);
        });

        test("should reject passwords shorter than 8 characters", async () => {
            const response = await request(app)
                .post("/api/auth/register")
                .send({
                    email: `short_${Date.now()}@example.com`,
                    password: "123"
                });

            expect(response.status).toBe(400);
        });

        test("should reject duplicate email addresses", async () => {
            const response = await request(app)
                .post("/api/auth/register")
                .send({
                    email: testEmail,
                    password: testPassword
                });

            expect(response.status).toBe(409);
            expect(response.body.message).toBe("Email already registered");
        });

        test("should reject privileged role assignment", async () => {
            const response = await request(app)
                .post("/api/auth/register")
                .send({
                    email: `admin_${Date.now()}@example.com`,
                    password: testPassword,
                    role: "ADMIN"
                });

            expect(response.status).toBe(403);
            expect(response.body.message).toContain("Privileged roles");
        });
    });

    describe("POST /api/auth/login", () => {

        test("should login successfully with valid credentials", async () => {
            const response = await request(app)
                .post("/api/auth/login")
                .send({
                    email: testEmail,
                    password: testPassword
                });

            expect(response.status).toBe(200);
            expect(response.body.message).toBe("Login successful");
            expect(response.body.token).toBeDefined();
            expect(response.body.user.email).toBe(testEmail);
        });

        test("should reject missing login fields", async () => {
            const response = await request(app)
                .post("/api/auth/login")
                .send({});

            expect(response.status).toBe(400);
        });

        test("should reject incorrect password", async () => {
            const response = await request(app)
                .post("/api/auth/login")
                .send({
                    email: testEmail,
                    password: "WrongPassword123"
                });

            expect(response.status).toBe(401);
            expect(response.body.message).toBe("Invalid email or password");
        });

        test("should reject an unregistered email", async () => {
            const response = await request(app)
                .post("/api/auth/login")
                .send({
                    email: "unknown_user@example.com",
                    password: testPassword
                });

            expect(response.status).toBe(401);
        });
    });

    describe("Authentication middleware", () => {

        test("should reject requests without an access token", async () => {
            const testApp = express();

            testApp.get(
                "/protected",
                authenticateToken,
                (req, res) => {
                    res.status(200).json({ message: "Authorized" });
                }
            );

            const response = await request(testApp)
                .get("/protected");

            expect(response.status).toBe(401);
            expect(response.body.message).toBe("Access token is required");
        });

        test("should reject an invalid access token", async () => {
            const testApp = express();

            testApp.get(
                "/protected",
                authenticateToken,
                (req, res) => {
                    res.status(200).json({ message: "Authorized" });
                }
            );

            const response = await request(testApp)
                .get("/protected")
                .set("Authorization", "Bearer invalid-token");

            expect(response.status).toBe(401);
            expect(response.body.message).toBe("Invalid or expired access token");
        });
    });
});
