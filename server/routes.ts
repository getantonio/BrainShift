import type { Express } from "express";
import { createServer, type Server } from "http";
import affirmationsRouter from "./routes/affirmations";

export function registerRoutes(app: Express): Server {
  // Register the affirmations routes
  app.use('/api', affirmationsRouter);

  const httpServer = createServer(app);

  return httpServer;
}
