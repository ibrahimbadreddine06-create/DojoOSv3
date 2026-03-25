import type { Express, Request, Response } from "express";
import { storage } from "./storage";
import { insertDailyStateSchema } from "../shared/schema";
import { randomBytes } from "crypto";

export function setupHealthRoutes(app: Express) {
  // ============================================
  // GOOGLE FIT OAUTH & SYNC
  // ============================================

  app.get("/api/health-sync/google-fit/auth", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return res.status(501).json({ message: "Google OAuth not configured on server (Missing GOOGLE_CLIENT_ID)" });
    }

    const redirectUri = `${req.protocol}://${req.get("host")}/api/health-sync/google-fit/callback`;
    const scopes = [
      "https://www.googleapis.com/auth/fitness.activity.read",
      "https://www.googleapis.com/auth/fitness.sleep.read",
      "https://www.googleapis.com/auth/fitness.body.read"
    ].join(" ");

    // Pass the user ID in the state to safely identify them on callback
    const state = Buffer.from((req.user as any).id).toString("base64");

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scopes)}&access_type=offline&prompt=consent&state=${state}`;
    
    res.redirect(authUrl);
  });

  app.get("/api/health-sync/google-fit/callback", async (req, res) => {
    const { code, state, error } = req.query;

    if (error) {
      return res.redirect("/body?error=google_fit_auth_failed");
    }

    if (!code || !state) {
      return res.status(400).send("Missing code or state");
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${req.protocol}://${req.get("host")}/api/health-sync/google-fit/callback`;

    if (!clientId || !clientSecret) {
      return res.status(501).send("Server missing Google credentials");
    }

    try {
      const userId = Buffer.from(state as string, "base64").toString("utf-8");

      // Exchange code for tokens
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code: code as string,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code"
        })
      });

      if (!tokenResponse.ok) {
        const errData = await tokenResponse.text();
        console.error("Google Fit Token Error:", errData);
        return res.redirect("/body?error=google_fit_token_failed");
      }

      const tokens = await tokenResponse.json();

      // tokens.access_token, tokens.refresh_token, tokens.expires_in
      await storage.updateUser(userId, {
        googleFitTokens: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiryDate: Date.now() + (tokens.expires_in * 1000)
        }
      } as any);

      // Redirect back to Body dashboard with success flag
      res.redirect("/body?success=google_fit_connected");

    } catch (err) {
      console.error("Health Sync Callback Error:", err);
      res.redirect("/body?error=google_fit_exception");
    }
  });


  // ============================================
  // APPLE HEALTH WEBHOOK (iOS Shortcuts Bridge)
  // ============================================

  app.post("/api/health-sync/apple-webhook/generate-token", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    // Generate a unique, rotating secure token for their webhook URL
    const token = randomBytes(24).toString("hex");
    const userId = (req.user as any).id;

    await storage.updateUser(userId, { appleHealthSyncToken: token } as any);

    const webhookUrl = `${req.protocol}://${req.get("host")}/api/health-sync/apple-webhook/${token}`;
    res.json({ webhookUrl, token });
  });

  app.post("/api/health-sync/apple-webhook/:token", async (req, res) => {
    const { token } = req.params;
    
    // Find user by this token
    const user = await storage.getUserByAppleHealthToken(token);
    if (!user) {
      return res.status(401).json({ message: "Invalid webhook token" });
    }

    // Process incoming HealthKit payload
    // Expected payload format from the iOS Shortcut:
    // { "date": "YYYY-MM-DD", "steps": 5000, "activeEnergy": 300, "sleepHours": 7.5, "hrv": 45 }
    
    try {
      const data = req.body;
      const targetDate = data.date || new Date().toISOString().split('T')[0];

      // Upsert into DailyState
      const updatePayload: any = {};
      if (typeof data.steps === 'number') updatePayload.steps = data.steps;
      if (typeof data.activeEnergy === 'number') updatePayload.caloriesBurned = data.activeEnergy;
      if (typeof data.sleepHours === 'number') updatePayload.sleepHours = data.sleepHours;
      if (typeof data.hrv === 'number') updatePayload.recoveryScore = data.hrv; // Simple mapping for now

      if (Object.keys(updatePayload).length > 0) {
        await storage.upsertDailyState(user.id, targetDate, updatePayload);
      }

      res.json({ success: true, processed: Object.keys(updatePayload) });
    } catch (e: any) {
      console.error("Apple Webhook Processing Error:", e);
      res.status(400).json({ message: "Invalid payload format" });
    }
  });

}
