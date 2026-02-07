import { body } from "express-validator";

export const validateEventCreation = [
  body("title").notEmpty().withMessage("Title is required"),
  body("description").notEmpty().withMessage("Description is required"),
  body("category")
    .isIn([
      "concert",
      "theater",
      "sports",
      "cultural",
      "workshop",
      "conference",
      "other",
    ])
    .withMessage("Invalid category"),
  body("startDate").isISO8601().withMessage("Invalid start date"),
  body("endDate").isISO8601().withMessage("Invalid end date"),
  body("venue.name").notEmpty().withMessage("Venue name is required"),
  body("venue.address").notEmpty().withMessage("Venue address is required"),
  body("venue.city").notEmpty().withMessage("Venue city is required"),
  body("venue.country").notEmpty().withMessage("Venue country is required"),
  body("tickets.total")
    .isInt({ min: 1 })
    .withMessage("Total tickets must be at least 1"),
  body("tickets.price")
    .isFloat({ min: 0 })
    .withMessage("Ticket price must be a positive number"),
];

export const validateRegistration = [
  body("email").isEmail().withMessage("Valid email is required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  body("name").notEmpty().withMessage("Name is required"),
  body("role")
    .isIn(["creator", "eventee"])
    .withMessage("Role must be either creator or eventee"),
];

export const validateLogin = [
  body("email").isEmail().withMessage("Valid email is required"),
  body("password").notEmpty().withMessage("Password is required"),
];
