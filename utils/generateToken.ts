import jwt from "jsonwebtoken";

export const generateToken = (id: string): string => {
  const secret: jwt.Secret = process.env.JWT_SECRET!;
  const expiresIn = process.env.JWT_EXPIRE! as jwt.SignOptions["expiresIn"];
  return jwt.sign({ id }, secret, { expiresIn });
};
