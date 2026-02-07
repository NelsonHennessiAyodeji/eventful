import request from "supertest";
import app from "../../src/app";
import User from "../../src/models/User";
import mongoose from "mongoose";

describe("Authentication", () => {
  beforeAll(async () => {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/test"
    );
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  describe("POST /api/auth/register", () => {
    it("should register a new user", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Test User",
          email: "test@example.com",
          password: "password123",
          role: "eventee",
        })
        .expect(201);

      expect(response.body).toHaveProperty("token");
      expect(response.body.user.email).toBe("test@example.com");
      expect(response.body.user.role).toBe("eventee");
    });

    it("should not register with existing email", async () => {
      await User.create({
        name: "Existing User",
        email: "test@example.com",
        password: "password123",
        role: "eventee",
      });

      const response = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Test User",
          email: "test@example.com",
          password: "password123",
          role: "eventee",
        })
        .expect(400);

      expect(response.body.error).toBe("User already exists");
    });
  });

  describe("POST /api/auth/login", () => {
    beforeEach(async () => {
      await User.create({
        name: "Test User",
        email: "test@example.com",
        password: "password123",
        role: "eventee",
      });
    });

    it("should login with valid credentials", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "test@example.com",
          password: "password123",
        })
        .expect(200);

      expect(response.body).toHaveProperty("token");
      expect(response.body.user.email).toBe("test@example.com");
    });

    it("should not login with invalid credentials", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "test@example.com",
          password: "wrongpassword",
        })
        .expect(401);

      expect(response.body.error).toBe("Invalid credentials");
    });
  });
});
