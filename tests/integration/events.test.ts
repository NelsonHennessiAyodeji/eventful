import request from "supertest";
import app from "../../src/app";
import User from "../../src/models/User";
import Event from "../../src/models/Event";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

describe("Events API", () => {
  let creatorToken: string;
  let eventeeToken: string;
  let creatorId: string;
  let eventId: string;

  beforeAll(async () => {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/test"
    );
  });

  beforeEach(async () => {
    // Create creator user
    const creator = await User.create({
      name: "Event Creator",
      email: "creator@example.com",
      password: "password123",
      role: "creator",
    });
    creatorId = creator._id.toString();
    creatorToken = jwt.sign(
      { userId: creatorId, email: creator.email, role: creator.role },
      process.env.JWT_SECRET!
    );

    // Create eventee user
    const eventee = await User.create({
      name: "Event Attendee",
      email: "eventee@example.com",
      password: "password123",
      role: "eventee",
    });
    eventeeToken = jwt.sign(
      { userId: eventee._id, email: eventee.email, role: eventee.role },
      process.env.JWT_SECRET!
    );
  });

  afterEach(async () => {
    await User.deleteMany({});
    await Event.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  describe("POST /api/events", () => {
    it("should create a new event (creator only)", async () => {
      const eventData = {
        title: "Test Concert",
        description: "An amazing concert",
        category: "concert",
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000
        ),
        venue: {
          name: "Test Venue",
          address: "123 Test St",
          city: "Test City",
          country: "Test Country",
        },
        tickets: {
          total: 100,
          price: 5000,
        },
      };

      const response = await request(app)
        .post("/api/events")
        .set("Authorization", `Bearer ${creatorToken}`)
        .send(eventData)
        .expect(201);

      eventId = response.body._id;

      expect(response.body.title).toBe(eventData.title);
      expect(response.body.organizer).toBe(creatorId);
      expect(response.body.tickets.sold).toBe(0);
    });

    it("should not allow eventee to create event", async () => {
      const response = await request(app)
        .post("/api/events")
        .set("Authorization", `Bearer ${eventeeToken}`)
        .send({
          title: "Test Event",
          description: "Test Description",
        })
        .expect(403);

      expect(response.body.error).toBe("Insufficient permissions");
    });
  });

  describe("GET /api/events", () => {
    beforeEach(async () => {
      await Event.create({
        title: "Published Event",
        description: "Published event description",
        category: "concert",
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000
        ),
        venue: {
          name: "Venue",
          address: "Address",
          city: "City",
          country: "Country",
        },
        organizer: creatorId,
        tickets: {
          total: 100,
          price: 5000,
        },
        isPublished: true,
      });

      await Event.create({
        title: "Unpublished Event",
        description: "Unpublished event",
        category: "theater",
        startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        endDate: new Date(
          Date.now() + 14 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000
        ),
        venue: {
          name: "Another Venue",
          address: "Another Address",
          city: "Another City",
          country: "Country",
        },
        organizer: creatorId,
        tickets: {
          total: 50,
          price: 3000,
        },
        isPublished: false,
      });
    });

    it("should return only published events", async () => {
      const response = await request(app).get("/api/events").expect(200);

      expect(response.body.events).toHaveLength(1);
      expect(response.body.events[0].title).toBe("Published Event");
    });

    it("should filter events by category", async () => {
      const response = await request(app)
        .get("/api/events?category=concert")
        .expect(200);

      expect(response.body.events).toHaveLength(1);
      expect(response.body.events[0].category).toBe("concert");
    });
  });
});
