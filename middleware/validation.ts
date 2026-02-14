import { body, validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";

export const validate = (validations: any[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    await Promise.all(validations.map((validation) => validation.run(req)));
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }
    res.status(400).json({ success: false, errors: errors.array() });
  };
};

// Example validation rules
export const registerValidation = [
  body("name").notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Valid email is required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("role")
    .isIn(["creator", "attendee"])
    .withMessage("Role must be creator or attendee"),
];

export const loginValidation = [
  body("email").isEmail().withMessage("Valid email is required"),
  body("password").notEmpty().withMessage("Password is required"),
];

export const eventValidation = [
  body("title").notEmpty().withMessage("Title is required"),
  body("description").notEmpty().withMessage("Description is required"),
  body("date").isISO8601().withMessage("Valid date is required"),
  body("location").notEmpty().withMessage("Location is required"),
  body("price").isNumeric().withMessage("Price must be a number"),
  body("totalTickets")
    .isInt({ min: 1 })
    .withMessage("Total tickets must be at least 1"),
  body("reminderDaysBefore")
    .optional()
    .isArray()
    .withMessage("Reminder days must be an array of numbers"),
];
