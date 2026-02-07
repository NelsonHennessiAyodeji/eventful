import dotenv from "dotenv";

dotenv.config({ path: ".env.test" });

// Mock external services
jest.mock("../src/services/notification.service", () => ({
  NotificationService: {
    createNotification: jest.fn(),
    scheduleEventReminders: jest.fn(),
    sendEmailNotification: jest.fn(),
  },
}));

jest.mock("../src/services/paystack.service", () => ({
  PaystackService: {
    initializeTransaction: jest.fn().mockResolvedValue({
      data: {
        authorization_url: "https://test.paystack.com",
        access_code: "test_access_code",
      },
    }),
    verifyTransaction: jest.fn().mockResolvedValue({
      data: {
        status: "success",
        id: "test_transaction_id",
      },
    }),
  },
}));
