import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { EXERCISES_DATA } from "./seeds/exercises";

process.on("unhandledRejection", (reason, promise) => {
  console.error("!!! Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("!!! Uncaught Exception:", err);
});

// Environment Variable Validation for Production
if (process.env.VERCEL === "1") {
  const required = ["DATABASE_URL", "SESSION_SECRET"];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error("\n\n#################################################");
    console.error("CRITICAL ERROR: MISSING ENVIRONMENT VARIABLES");
    console.error(`Please add the following variables in Vercel Dashboard:`);
    missing.forEach(m => console.error(`- ${m}`));
    console.error("#################################################\n\n");
    // We don't exit(1) here to allow the logs to actually showing up in Vercel's dashboard before the function dies
  }

  if (process.env.GOOGLE_CLIENT_ID && !process.env.GOOGLE_CLIENT_SECRET) {
      console.warn("WARNING: GOOGLE_CLIENT_ID is set but GOOGLE_CLIENT_SECRET is missing or empty.");
  }
}

const app = express();
export default app; // Export immediately for Vercel

app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    env: process.env.NODE_ENV,
    vercel: process.env.VERCEL,
    db: !!process.env.DATABASE_URL,
    auth: !!process.env.SESSION_SECRET
  });
});

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
    // Only seed if we have a database
    if (!process.env.DATABASE_URL) return;

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

// Run the seeder in the background
seedDatabase();

// 5. Setup Serving and Listener
(async () => {
  if (process.env.VERCEL === '1') {
    // On Vercel, we just need the routes to be registered.
    // Static serving is handled either by the Express app or Vercel's static builder.
    // We'll let the Express app try to serve static files if they are available.
    try {
      serveStatic(app);
    } catch (e) {
      console.warn("Static serving skipped on Vercel:", (e as Error).message);
    }
  } else {
    // Local Development
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    const port = parseInt(process.env.PORT || '5000', 10);
    server.listen({ port, host: "0.0.0.0" }, () => {
      log(`serving on port ${port}`);
    });
  }
})();
