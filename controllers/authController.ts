import { Request, Response } from "express";
import User from "../models/User";
import { AuthRequest } from "../middleware/auth";
import { generateToken } from "../utils/generateToken";
import { successResponse, errorResponse } from "../utils/apiResponse";

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) {
      return errorResponse(res, "User already exists", 400);
    }
    const user = await User.create({ name, email, password, role });
    const token = generateToken(user.id);
    successResponse(
      res,
      { user: { id: user.id, name, email, role }, token },
      "Registration successful",
      201
    );
  } catch (error) {
    errorResponse(res, "Server error", 500);
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return errorResponse(res, "Invalid credentials", 401);
    }
    const token = generateToken(user.id);
    successResponse(
      res,
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        token,
      },
      "Login successful"
    );
  } catch (error) {
    errorResponse(res, "Server error", 500);
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  successResponse(res, req.user);
};
