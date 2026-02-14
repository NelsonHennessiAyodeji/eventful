import { app, connectToDatabase } from "../server";

// Vercel serverless function handler
export default async function handler(req: any, res: any) {
  // Ensure database is connected before each request
  await connectToDatabase();
  // Let Express handle the request
  return app(req, res);
}
