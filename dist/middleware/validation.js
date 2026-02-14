"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventValidation = exports.loginValidation = exports.registerValidation = exports.validate = void 0;
const express_validator_1 = require("express-validator");
const validate = (validations) => {
    return async (req, res, next) => {
        await Promise.all(validations.map((validation) => validation.run(req)));
        const errors = (0, express_validator_1.validationResult)(req);
        if (errors.isEmpty()) {
            return next();
        }
        res.status(400).json({ success: false, errors: errors.array() });
    };
};
exports.validate = validate;
// Example validation rules
exports.registerValidation = [
    (0, express_validator_1.body)("name").notEmpty().withMessage("Name is required"),
    (0, express_validator_1.body)("email").isEmail().withMessage("Valid email is required"),
    (0, express_validator_1.body)("password")
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 characters"),
    (0, express_validator_1.body)("role")
        .isIn(["creator", "attendee"])
        .withMessage("Role must be creator or attendee"),
];
exports.loginValidation = [
    (0, express_validator_1.body)("email").isEmail().withMessage("Valid email is required"),
    (0, express_validator_1.body)("password").notEmpty().withMessage("Password is required"),
];
exports.eventValidation = [
    (0, express_validator_1.body)("title").notEmpty().withMessage("Title is required"),
    (0, express_validator_1.body)("description").notEmpty().withMessage("Description is required"),
    (0, express_validator_1.body)("date").isISO8601().withMessage("Valid date is required"),
    (0, express_validator_1.body)("location").notEmpty().withMessage("Location is required"),
    (0, express_validator_1.body)("price").isNumeric().withMessage("Price must be a number"),
    (0, express_validator_1.body)("totalTickets")
        .isInt({ min: 1 })
        .withMessage("Total tickets must be at least 1"),
    (0, express_validator_1.body)("reminderDaysBefore")
        .optional()
        .isArray()
        .withMessage("Reminder days must be an array of numbers"),
];
