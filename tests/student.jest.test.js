
require("dotenv").config();

const request = require("supertest");
const app = require("../server");
const prisma = require("../lib/prisma");

describe("Student CRUD API - Jest and Supertest", () => {
    let department;
    let user1;
    let user2;
    let studentId;

    const suffix = `${Date.now()}`;

    const studentData = {
        registrationNumber: `JEST${suffix}`,
        fullName: "Jest Test Student",
        program: "AIML",
        batchYear: 2026
    };

    beforeAll(async () => {
        department = await prisma.department.create({
            data: {
                name: `Jest Department ${suffix}`,
                code: `JD${suffix}`
            }
        });

        user1 = await prisma.user.create({
            data: {
                email: `student1_${suffix}@example.com`,
                passwordHash: "test-hash"
            }
        });

        user2 = await prisma.user.create({
            data: {
                email: `student2_${suffix}@example.com`,
                passwordHash: "test-hash"
            }
        });
    });

    afterAll(async () => {
        await prisma.student.deleteMany({
            where: {
                userId: {
                    in: [user1.id, user2.id]
                }
            }
        });

        await prisma.user.deleteMany({
            where: {
                id: {
                    in: [user1.id, user2.id]
                }
            }
        });

        await prisma.department.delete({
            where: { id: department.id }
        });
    });

    // CREATE STUDENT
    test("POST - should create a student successfully", async () => {
        const response = await request(app)
            .post("/api/students")
            .send({
                userId: user1.id,
                departmentId: department.id,
                ...studentData
            });

        expect(response.status).toBe(201);
        expect(response.body.message).toBe("Student created successfully");
        expect(response.body.student.fullName).toBe(studentData.fullName);

        studentId = response.body.student.id;
    });

    test("POST - should reject missing required fields", async () => {
        const response = await request(app)
            .post("/api/students")
            .send({
                fullName: "Incomplete Student"
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBeDefined();
    });

    test("POST - should reject duplicate registration number", async () => {
        const response = await request(app)
            .post("/api/students")
            .send({
                userId: user2.id,
                departmentId: department.id,
                ...studentData
            });

        expect(response.status).toBe(409);
        expect(response.body.message).toBe("A unique field already exists");
    });

    // READ STUDENTS
    test("GET - should retrieve all students", async () => {
        const response = await request(app)
            .get("/api/students");

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.some(student => student.id === studentId)).toBe(true);
    });

    test("GET - should retrieve a student by ID", async () => {
        const response = await request(app)
            .get(`/api/students/${studentId}`);

        expect(response.status).toBe(200);
        expect(response.body.id).toBe(studentId);
        expect(response.body.fullName).toBe(studentData.fullName);
    });

    test("GET - should reject an invalid student ID", async () => {
        const response = await request(app)
            .get("/api/students/invalid");

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Invalid student ID");
    });

    test("GET - should return 404 for a nonexistent student", async () => {
        const response = await request(app)
            .get("/api/students/999999999");

        expect(response.status).toBe(404);
        expect(response.body.message).toBe("Student not found");
    });

    // UPDATE STUDENT
    test("PUT - should update student successfully", async () => {
        const response = await request(app)
            .put(`/api/students/${studentId}`)
            .send({
                fullName: "Updated Jest Student",
                city: "Bangalore"
            });

        expect(response.status).toBe(200);
        expect(response.body.message).toBe("Student updated successfully");
        expect(response.body.student.fullName).toBe("Updated Jest Student");
    });

    test("PUT - should reject invalid student ID", async () => {
        const response = await request(app)
            .put("/api/students/invalid")
            .send({
                fullName: "Invalid Update"
            });

        expect(response.status).toBe(400);
    });

    test("PUT - should return 404 for a nonexistent student", async () => {
        const response = await request(app)
            .put("/api/students/999999999")
            .send({
                fullName: "Unknown Student"
            });

        expect(response.status).toBe(404);
        expect(response.body.message).toBe("Student not found");
    });

    // DELETE STUDENT
    test("DELETE - should delete student successfully", async () => {
        const response = await request(app)
            .delete(`/api/students/${studentId}`);

        expect(response.status).toBe(200);
        expect(response.body.message).toBe("Student deleted successfully");
    });

    test("DELETE - should return 404 for an already deleted student", async () => {
        const response = await request(app)
            .delete(`/api/students/${studentId}`);

        expect(response.status).toBe(404);
        expect(response.body.message).toBe("Student not found");
    });

    test("DELETE - should reject invalid student ID", async () => {
        const response = await request(app)
            .delete("/api/students/invalid");

        expect(response.status).toBe(400);
    });
});
