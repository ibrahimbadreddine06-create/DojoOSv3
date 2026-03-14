import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { EXERCISES_DATA } from "./seeds/exercises";

const app = express();
export default app; // Export immediately for Vercel

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
      if (logLine.length > 80) logLine = logLine.slice(0, 79) + "…";
      log(logLine);
    }
  });

  next();
});

// 1. Setup Auth
if (process.env.DISABLE_AUTH !== "true") {
  try {
    setupAuth(app);
  } catch(e) {
    console.error("Auth Setup Error (missing env vars?):", e);
  }
}

// 2. Setup Routes Synchronously
const server = registerRoutes(app);

// 3. Error Handling Middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
});

// 4. Background Database Seeding (Fire and Forget)
async function seedDatabase() {
  try {
    const existing = await storage.getExerciseLibrary().catch(err => {
      console.error("DB Query Failed (Missing DATABASE_URL on Vercel?):", err);
      return [];
    });
    
    if (existing && existing.length === 0) {
      console.log("Seeding exercises...");
      for (const ex of EXERCISES_DATA) {
        await storage.createExerciseLibraryItem(ex).catch(e => console.error(e));
      }
    }
    
    const existingDisciplines = await storage.getDisciplines().catch(e => []);
    if (existingDisciplines && existingDisciplines.length === 0) {
      await storage.createDiscipline({
        name: "Mastery Quest",
        description: "Your journey starts here. Learn to use DojoOS to master any skill.",
        level: 1, currentXp: 0, maxXp: 100, color: "text-primary", icon: "Zap"
      }).catch(e => console.error(e));
    }
  } catch (err) {
    console.error("Critical Seeding Error:", err);
  }
}

// Run the seeder in the background without blocking the Node Vercel export
seedDatabase();

// 5. Local Dev Only: Vite & Express Listener
if (process.env.VERCEL !== '1') {
  (async () => {
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    const port = parseInt(process.env.PORT || '5000', 10);
    server.listen({ port, host: "0.0.0.0" }, () => {
      log(`serving on port ${port}`);
    });
  })();
}
