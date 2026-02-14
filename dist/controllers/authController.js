"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.login = exports.register = void 0;
const User_1 = __importDefault(require("../models/User"));
const generateToken_1 = require("../utils/generateToken");
const apiResponse_1 = require("../utils/apiResponse");
const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        const userExists = await User_1.default.findOne({ email });
        if (userExists) {
            return (0, apiResponse_1.errorResponse)(res, "User already exists", 400);
        }
        const user = await User_1.default.create({ name, email, password, role });
        const token = (0, generateToken_1.generateToken)(user.id);
        (0, apiResponse_1.successResponse)(res, { user: { id: user.id, name, email, role }, token }, "Registration successful", 201);
    }
    catch (error) {
        (0, apiResponse_1.errorResponse)(res, "Server error", 500);
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User_1.default.findOne({ email });
        if (!user || !(await user.comparePassword(password))) {
            return (0, apiResponse_1.errorResponse)(res, "Invalid credentials", 401);
        }
        const token = (0, generateToken_1.generateToken)(user.id);
        (0, apiResponse_1.successResponse)(res, {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
            token,
        }, "Login successful");
    }
    catch (error) {
        (0, apiResponse_1.errorResponse)(res, "Server error", 500);
    }
};
exports.login = login;
const getMe = async (req, res) => {
    (0, apiResponse_1.successResponse)(res, req.user);
};
exports.getMe = getMe;
