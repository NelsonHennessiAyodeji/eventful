import { Request, Response } from "express";
import { body, validationResult } from "express-validator";
import User from "../models/User";
import { generateToken } from "../utils/jwt";
import { AuthRequest } from "../middlewares/auth";

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      // Validation
      await body("email").isEmail().normalizeEmail().run(req);
      await body("password").isLength({ min: 6 }).run(req);
      await body("name").notEmpty().trim().run(req);
      await body("role").isIn(["creator", "eventee"]).run(req);

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, name, role, phone } = req.body;

      // Check if user exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: "User already exists" });
      }

      // Create user
      const user = new User({
        email,
        password,
        name,
        role,
        phone,
      });

      await user.save();

      // Generate token
      const token = generateToken({
        userId: user._id,
        email: user.email,
        role: user.role,
      });

      // Remove password from response
      const userResponse = user.toObject() as any;
      delete userResponse.password;

      res.status(201).json({
        user: userResponse,
        token,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      // Validation
      await body("email").isEmail().normalizeEmail().run(req);
      await body("password").notEmpty().run(req);

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Find user
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Check password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Generate token
      const token = generateToken({
        userId: user._id,
        email: user.email,
        role: user.role,
      });

      // Remove password from response
      const userResponse = user.toObject() as any;
      delete userResponse.password;

      res.json({
        user: userResponse,
        token,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getProfile(req: AuthRequest, res: Response) {
    try {
      const user = await User.findById(req.user._id).select("-password");
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async updateProfile(req: AuthRequest, res: Response) {
    try {
      const updates = req.body;
      delete updates.password; // Prevent password update here
      delete updates.role; // Prevent role change

      const user = await User.findByIdAndUpdate(
        req.user._id,
        { $set: updates },
        { new: true, runValidators: true }
      ).select("-password");

      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
