
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const prisma = require("./lib/prisma");
const errorHandler = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
    console.log(`[REQUEST] ${req.method} ${req.originalUrl}`);
    next();
});

// Home route
app.get("/", (req, res) => {
    res.status(200).json({
        message: "Lumina Placement Management API is running"
    });
});

// Database health check
app.get("/api/health/db", async (req, res, next) => {
    try {
        await prisma.$queryRaw`SELECT 1`;

        res.status(200).json({
            message: "Database connected successfully"
        });
    } catch (error) {
        next(error);
    }
});

// Authentication routes
app.use("/api/auth", require("./routes/authRoutes"));

// Student and related CRUD routes
app.use("/api/students", require("./routes/studentRoutes"));
app.use("/api/departments", require("./routes/departmentRoutes"));
app.use("/api/skills", require("./routes/skillRoutes"));
app.use("/api/projects", require("./routes/projectRoutes"));
app.use("/api/internships", require("./routes/internshipRoutes"));

// Additional CRUD routes
app.use(
    "/api/semester-performance",
    require("./routes/semesterPerformanceRoutes")
);
app.use("/api/resumes", require("./routes/resumeRoutes"));
app.use("/api/activities", require("./routes/activityRoutes"));
app.use("/api/sports", require("./routes/sportRoutes"));
app.use("/api/awards", require("./routes/awardRoutes"));

// Handle unknown routes
app.use((req, res) => {
    res.status(404).json({
        message: "API endpoint not found",
        method: req.method,
        path: req.originalUrl
    });
});

// Central error handler (must remain last)
app.use(errorHandler);

// Start server only when executed directly
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Lumina API running at http://localhost:${PORT}`);
    });
}

// Export Express app for Jest and Supertest
module.exports = app;
