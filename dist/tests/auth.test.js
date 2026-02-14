"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const server_1 = require("../server");
const mongoose_1 = __importDefault(require("mongoose"));
beforeAll(async () => {
    // Connect to test database
    await mongoose_1.default.connect(process.env.MONGODB_URI_TEST);
});
afterAll(async () => {
    await mongoose_1.default.connection.close();
});
describe("Auth Endpoints", () => {
    it("should register a new user", async () => {
        const res = await (0, supertest_1.default)(server_1.app).post("/api/auth/register").send({
            name: "Test User",
            email: "test@example.com",
            password: "123456",
            role: "attendee",
        });
        expect(res.statusCode).toEqual(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty("token");
    });
    it("should login existing user", async () => {
        const res = await (0, supertest_1.default)(server_1.app).post("/api/auth/login").send({
            email: "test@example.com",
            password: "123456",
        });
        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty("token");
    });
});
