import swaggerJsdoc from "swagger-jsdoc";

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Eventful API",
      version: "1.0.0",
      description: "Event ticketing platform API documentation",
      contact: {
        name: "Eventful Support",
        email: "support@eventful.com",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers: [
      {
        url: "http://localhost:5000",
        description: "Development server",
      },
      {
        url: "https://api.eventful.com",
        description: "Production server",
      },
    ],
    tags: [
      {
        name: "Authentication",
        description: "User authentication and registration",
      },
      {
        name: "Events",
        description: "Event management endpoints",
      },
      {
        name: "Tickets",
        description: "Ticket purchase and management",
      },
      {
        name: "Payments",
        description: "Payment processing endpoints",
      },
      {
        name: "Analytics",
        description: "Event analytics endpoints",
      },
      {
        name: "Notifications",
        description: "Notification management endpoints",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description:
            'JWT Authorization header using the Bearer scheme. Example: "Bearer {token}"',
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              example: "507f1f77bcf86cd799439011",
            },
            name: {
              type: "string",
              example: "John Doe",
            },
            email: {
              type: "string",
              format: "email",
              example: "john@example.com",
            },
            role: {
              type: "string",
              enum: ["creator", "eventee"],
              example: "eventee",
            },
            phone: {
              type: "string",
              example: "+2348012345678",
            },
            avatar: {
              type: "string",
              example: "https://example.com/avatar.jpg",
            },
            isVerified: {
              type: "boolean",
              default: false,
            },
            notifications: {
              type: "object",
              properties: {
                email: {
                  type: "boolean",
                  default: true,
                },
                push: {
                  type: "boolean",
                  default: true,
                },
              },
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
        Event: {
          type: "object",
          required: [
            "title",
            "description",
            "category",
            "startDate",
            "endDate",
            "venue",
            "tickets",
          ],
          properties: {
            title: {
              type: "string",
              example: "Summer Music Festival 2024",
            },
            description: {
              type: "string",
              example: "Annual summer music festival featuring top artists",
            },
            category: {
              type: "string",
              enum: [
                "concert",
                "theater",
                "sports",
                "cultural",
                "workshop",
                "conference",
                "other",
              ],
              example: "concert",
            },
            startDate: {
              type: "string",
              format: "date-time",
              example: "2024-07-15T18:00:00Z",
            },
            endDate: {
              type: "string",
              format: "date-time",
              example: "2024-07-15T23:00:00Z",
            },
            venue: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                  example: "National Stadium",
                },
                address: {
                  type: "string",
                  example: "123 Stadium Road",
                },
                city: {
                  type: "string",
                  example: "Lagos",
                },
                country: {
                  type: "string",
                  example: "Nigeria",
                },
                coordinates: {
                  type: "object",
                  properties: {
                    lat: {
                      type: "number",
                      example: 6.465422,
                    },
                    lng: {
                      type: "number",
                      example: 3.406448,
                    },
                  },
                },
              },
            },
            organizer: {
              type: "string",
              example: "507f1f77bcf86cd799439011",
            },
            tickets: {
              type: "object",
              properties: {
                total: {
                  type: "integer",
                  minimum: 1,
                  example: 1000,
                },
                sold: {
                  type: "integer",
                  default: 0,
                  example: 150,
                },
                price: {
                  type: "number",
                  minimum: 0,
                  example: 5000,
                },
                currency: {
                  type: "string",
                  default: "NGN",
                  example: "NGN",
                },
                types: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: {
                        type: "string",
                        example: "VIP",
                      },
                      price: {
                        type: "number",
                        example: 15000,
                      },
                      quantity: {
                        type: "integer",
                        example: 50,
                      },
                      sold: {
                        type: "integer",
                        default: 0,
                        example: 10,
                      },
                    },
                  },
                },
              },
            },
            images: {
              type: "array",
              items: {
                type: "string",
                example: "https://example.com/event-image.jpg",
              },
            },
            socialLinks: {
              type: "object",
              properties: {
                facebook: {
                  type: "string",
                  example: "https://facebook.com/event",
                },
                twitter: {
                  type: "string",
                  example: "https://twitter.com/event",
                },
                instagram: {
                  type: "string",
                  example: "https://instagram.com/event",
                },
                website: {
                  type: "string",
                  example: "https://event-website.com",
                },
              },
            },
            reminderSettings: {
              type: "object",
              properties: {
                creatorReminder: {
                  type: "object",
                  properties: {
                    enabled: {
                      type: "boolean",
                      default: true,
                    },
                    intervals: {
                      type: "array",
                      items: {
                        type: "integer",
                      },
                      default: [24, 2],
                      example: [24, 2],
                    },
                  },
                },
              },
            },
            isPublished: {
              type: "boolean",
              default: false,
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
        Ticket: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              example: "507f1f77bcf86cd799439012",
            },
            event: {
              type: "string",
              example: "507f1f77bcf86cd799439013",
            },
            user: {
              type: "string",
              example: "507f1f77bcf86cd799439011",
            },
            ticketType: {
              type: "string",
              example: "General Admission",
            },
            price: {
              type: "number",
              example: 5000,
            },
            currency: {
              type: "string",
              example: "NGN",
            },
            qrCode: {
              type: "string",
              description: "Base64 encoded QR code image",
            },
            isScanned: {
              type: "boolean",
              default: false,
            },
            scannedAt: {
              type: "string",
              format: "date-time",
            },
            scannedBy: {
              type: "string",
              example: "507f1f77bcf86cd799439014",
            },
            purchaseDate: {
              type: "string",
              format: "date-time",
            },
            paymentStatus: {
              type: "string",
              enum: ["pending", "paid", "failed", "refunded"],
              example: "paid",
            },
            paymentReference: {
              type: "string",
              example: "TKT-1698765432-abc123",
            },
            metadata: {
              type: "object",
              properties: {
                seatNumber: {
                  type: "string",
                  example: "A12",
                },
                row: {
                  type: "string",
                  example: "A",
                },
                section: {
                  type: "string",
                  example: "VIP",
                },
              },
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
        Payment: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              example: "507f1f77bcf86cd799439015",
            },
            user: {
              type: "string",
              example: "507f1f77bcf86cd799439011",
            },
            event: {
              type: "string",
              example: "507f1f77bcf86cd799439013",
            },
            ticket: {
              type: "string",
              example: "507f1f77bcf86cd799439012",
            },
            amount: {
              type: "number",
              example: 5000,
            },
            currency: {
              type: "string",
              example: "NGN",
            },
            status: {
              type: "string",
              enum: ["pending", "successful", "failed", "refunded"],
              example: "successful",
            },
            paystackReference: {
              type: "string",
              example: "PS-1698765432-xyz789",
            },
            paystackAccessCode: {
              type: "string",
              example: "ACC-abc123xyz789",
            },
            paystackTransactionId: {
              type: "string",
              example: "1234567890",
            },
            paymentMethod: {
              type: "string",
              example: "card",
            },
            metadata: {
              type: "object",
              additionalProperties: true,
            },
            paidAt: {
              type: "string",
              format: "date-time",
            },
            refundedAt: {
              type: "string",
              format: "date-time",
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
        Notification: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              example: "507f1f77bcf86cd799439016",
            },
            user: {
              type: "string",
              example: "507f1f77bcf86cd799439011",
            },
            event: {
              type: "string",
              example: "507f1f77bcf86cd799439013",
            },
            type: {
              type: "string",
              enum: [
                "event_reminder",
                "ticket_purchased",
                "event_updated",
                "payment_success",
                "system",
              ],
              example: "event_reminder",
            },
            title: {
              type: "string",
              example: "Event Reminder",
            },
            message: {
              type: "string",
              example: "Your event starts in 24 hours",
            },
            data: {
              type: "object",
              additionalProperties: true,
            },
            isRead: {
              type: "boolean",
              default: false,
            },
            scheduledFor: {
              type: "string",
              format: "date-time",
            },
            sentAt: {
              type: "string",
              format: "date-time",
            },
            readAt: {
              type: "string",
              format: "date-time",
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
        Error: {
          type: "object",
          properties: {
            error: {
              type: "string",
              example: "Invalid request parameters",
            },
            message: {
              type: "string",
              example: "Validation failed",
            },
            details: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  field: { type: "string" },
                  message: { type: "string" },
                },
              },
            },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: "Access token is missing or invalid",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error",
              },
              example: {
                error: "Unauthorized",
                message: "Please authenticate",
              },
            },
          },
        },
        NotFoundError: {
          description: "The specified resource was not found",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error",
              },
              example: {
                error: "Not Found",
                message: "Event not found",
              },
            },
          },
        },
        ValidationError: {
          description: "Validation error",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error",
              },
              example: {
                error: "Validation Error",
                message: "Invalid input data",
                details: [
                  {
                    field: "email",
                    message: "Email must be valid",
                  },
                ],
              },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [
    "./src/routes/*.ts", // Route files
    "./src/models/*.ts", // Model schemas (optional)
    "./src/controllers/*.ts", // Controller files (optional)
  ],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

export default swaggerSpec;
