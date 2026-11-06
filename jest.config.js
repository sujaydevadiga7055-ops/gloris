
module.exports = {
    testEnvironment: "node",

    testMatch: ["**/tests/**/*.jest.test.js"],

    collectCoverageFrom: [
        "controllers/authController.js",
        "controllers/studentController.js",
        "routes/authRoutes.js",
        "routes/studentRoutes.js",
        "middleware/authenticateToken.js"
    ],

    coverageDirectory: "coverage",

    coverageReporters: ["text", "html"]
};
