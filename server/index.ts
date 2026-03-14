import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
export default app;

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}
app.use(express.json({
  limit: "50mb",
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false, limit: "50mb" }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

import { storage } from "./storage";
import { setupAuth } from "./auth";
import { EXERCISES_DATA } from "./seeds/exercises";

(async () => {
  // SEEDING: Check if exercises exist, if not, populate them (Fix for MemStorage persistence)
  try {
    const existing = await storage.getExerciseLibrary();
    if (existing.length === 0) {
      console.log("Seeding verified exercises into active storage...");
      for (const ex of EXERCISES_DATA) {
        await storage.createExerciseLibraryItem(ex);
      }
      console.log(`Seeded ${EXERCISES_DATA.length} exercises successfully.`);
    }

    // Seed sample discipline
    const existingDisciplines = await storage.getDisciplines();
    if (existingDisciplines.length === 0) {
      console.log("Seeding sample discipline...");
      await storage.createDiscipline({
        name: "Mastery Quest",
        description: "Your journey starts here. Learn to use DojoOS to master any skill.",
        level: 1,
        currentXp: 0,
        maxXp: 100,
        color: "text-primary",
        icon: "Zap"
      });
      console.log("Sample discipline seeded.");
    }
  } catch (err) {
    console.error("Seeding failed:", err);
  }

  // Auth Setup - REVERSIBLE: Set DISABLE_AUTH=true env var to disable
  if (process.env.DISABLE_AUTH !== "true") {
    setupAuth(app);
  }

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  
  // Only listen if not running in a Vercel Serverless function environment
  if (process.env.VERCEL !== '1') {
    server.listen({
      port,
      host: "0.0.0.0",
    }, () => {
      log(`serving on port ${port}`);
    });
  }
})();
