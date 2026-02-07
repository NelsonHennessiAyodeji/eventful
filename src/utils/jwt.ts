import jwt from "jsonwebtoken";
import { Types } from "mongoose";

export interface TokenPayload {
  userId: Types.ObjectId;
  email: string;
  role: string;
}

export const generateToken = (payload: TokenPayload): string => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }

  // Convert payload to plain object with string userId
  const tokenPayload = {
    userId: payload.userId.toString(),
    email: payload.email,
    role: payload.role,
  };

  return jwt.sign(tokenPayload, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  } as jwt.SignOptions);
};

export const verifyToken = (token: string): TokenPayload => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }

  try {
    const decoded = jwt.verify(token, secret) as {
      userId: string;
      email: string;
      role: string;
      iat?: number;
      exp?: number;
    };

    // Convert string userId back to ObjectId
    return {
      userId: new Types.ObjectId(decoded.userId),
      email: decoded.email,
      role: decoded.role,
    };
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      throw new Error("Token expired");
    } else if (error.name === "JsonWebTokenError") {
      throw new Error("Invalid token");
    }
    throw error;
  }
};
