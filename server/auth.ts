
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Express } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "../shared/schema";
import { db, pool } from "./db"; // Needed for session store pool

import MemoryStore from "memorystore";

const scryptAsync = promisify(scrypt);
const MemoryStoreSession = MemoryStore(session);

// Re-export User type to avoid confusion
type User = SelectUser;

declare global {
    namespace Express {
        interface User extends SelectUser { }
    }
}

export function setupAuth(app: Express) {
    // Session Configuration
    const sessionSettings: session.SessionOptions = {
        secret: process.env.SESSION_SECRET || "dojo_os_fortress_secret_key_change_me",
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
            httpOnly: true,
            sameSite: "lax", // Better for OAuth redirects
            secure: process.env.VERCEL === "1", // Use secure on Vercel
        },
    };

    if (process.env.VERCEL === "1") {
        app.set("trust proxy", 1);
    }

    // Try Postgres Sample Store, fallback to Memory
    let storeInitialized = false;
    if (pool && process.env.NODE_ENV === "production") {
        try {
            const pgSession = connectPgSimple(session);
            sessionSettings.store = new pgSession({
                pool,
                createTableIfMissing: true,
                tableName: 'session'
            });
            console.log("Postgres session store initialized.");
            storeInitialized = true;
        } catch (e) {
            console.error("Postgres session store failure, falling back to MemoryStore:", e);
        }
    }

    if (!storeInitialized) {
        sessionSettings.store = new MemoryStoreSession({
            checkPeriod: 86400000 // prune expired entries every 24h
        });
        console.warn("Using MemoryStore for sessions.");
    }

    app.use(session(sessionSettings));
    app.use(passport.initialize());
    app.use(passport.session());

    // Password Hashing (scrypt)
    async function hashPassword(password: string) {
        const salt = randomBytes(16).toString("hex");
        const buf = (await scryptAsync(password, salt, 64)) as Buffer;
        return `${buf.toString("hex")}.${salt}`;
    }

    async function comparePassword(supplied: string, stored: string) {
        const [hashed, salt] = stored.split(".");
        const hashedBuf = Buffer.from(hashed, "hex");
        const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
        return timingSafeEqual(hashedBuf, suppliedBuf);
    }

    // Passport Local Strategy
    passport.use(
        new LocalStrategy(async (username, password, done) => {
            try {
                const user = (await storage.getUserByUsername(username)) as User | undefined;
                if (!user) {
                    return done(null, false, { message: "Invalid credentials" });
                }
                if (!user.password) {
                    return done(null, false, { message: "Account not migrated to secure auth." });
                }
                const isValid = await comparePassword(password, user.password);
                if (!isValid) {
                    return done(null, false, { message: "Invalid credentials" });
                }
                return done(null, user);
            } catch (err) {
                return done(err);
            }
        }),
    );

    // Google Strategy
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
        console.log("Initializing Google OAuth Strategy...");
        passport.use(
            new GoogleStrategy(
                {
                    clientID: process.env.GOOGLE_CLIENT_ID,
                    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                    callbackURL: "/api/auth/google/callback",
                    proxy: true // Required for Vercel/proxies
                },
                async (accessToken, refreshToken, profile, done) => {
                    try {
                        const email = profile.emails?.[0]?.value;
                        if (!email) {
                            console.error("Google Auth Error: No email in profile");
                            return done(new Error("No email found in Google profile"));
                        }

                        // Try to find user by email first (Account Linking)
                        let user = await storage.getUserByEmail(email);
                        if (!user) {
                            // Fallback: Try username match (legacy)
                            user = await storage.getUserByUsername(email);
                        }

                        if (!user) {
                            console.log(`Auto-registering new user via Google: ${email}`);
                            // Auto-register user from Google
                            // Generate a dummy password since they use Google
                            const dummyPassword = await hashPassword(randomBytes(16).toString("hex"));
                            const dummySalt = randomBytes(16).toString("hex");

                            user = await storage.createUser({
                                username: email.split("@")[0], // Use part before @ as username
                                email: email,
                                password: dummyPassword,
                                encryptionKeySalt: dummySalt,
                            });
                        }

                        return done(null, user);
                    } catch (err: any) {
                        console.error("Critical Google Strategy Error:", err);
                        return done(err);
                    }
                }
            )
        );
    } else {
        console.warn("Google OAuth skipped: GOOGLE_CLIENT_ID/SECRET not set.");
    }

    passport.serializeUser((user, done) => done(null, user.id));
    passport.deserializeUser(async (id: string, done) => {
        try {
            const user = await storage.getUser(id);
            done(null, user);
        } catch (err) {
            done(err);
        }
    });

    // Auth Routes
    app.post("/api/register", async (req, res, next) => {
        try {
            const existingUser = await storage.getUserByUsername(req.body.username);
            if (existingUser) {
                return res.status(400).send("Username already exists");
            }

            // Check if email exists
            if (req.body.email) {
                const existingEmail = await storage.getUserByEmail(req.body.email);
                if (existingEmail) {
                    return res.status(400).send("Email already registered. Try logging in with Google.");
                }
            }

            const hashedPassword = await hashPassword(req.body.password);
            const encryptionKeySalt = randomBytes(16).toString("hex");

            const user = await storage.createUser({
                ...req.body,
                password: hashedPassword,
                encryptionKeySalt: encryptionKeySalt,
            });

            req.login(user, (err) => {
                if (err) return next(err);
                res.status(201).json(user);
            });
        } catch (err) {
            next(err);
        }
    });

    app.post("/api/login", (req, res, next) => {
        console.log(`Attempting login for user: ${req.body.username}`);
        passport.authenticate("local", (err: any, user: User, info: any) => {
            if (err) {
                console.error("Login Authentication Error:", err);
                return next(err);
            }
            if (!user) {
                console.warn(`Login failed for ${req.body.username}: ${info?.message}`);
                return res.status(401).json({ message: info?.message || "Authentication failed" });
            }
            req.login(user, (err) => {
                if (err) {
                    console.error("req.login Error:", err);
                    return next(err);
                }
                console.log(`User ${user.username} logged in successfully.`);
                const { password, ...safeUser } = user;
                res.json(safeUser);
            });
        })(req, res, next);
    });

    app.post("/api/logout", (req, res, next) => {
        req.logout((err) => {
            if (err) return next(err);
            res.sendStatus(200);
        });
    });

    // Google OAuth Routes with Guards
    const googleEnabled = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

    app.get(
        "/api/auth/google",
        (req, res, next) => {
            if (!googleEnabled) {
                return res.status(501).json({
                    error: "Google OAuth not configured",
                    message: "Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in Vercel environment variables."
                });
            }
            next();
        },
        passport.authenticate("google", { scope: ["profile", "email"] })
    );

    app.get(
        "/api/auth/google/callback",
        (req, res, next) => {
            if (!googleEnabled) return res.status(501).send("OAuth not configured");
            next();
        },
        passport.authenticate("google", { failureRedirect: "/auth" }),
        (req, res) => {
            res.redirect("/");
        }
    );

    app.get("/api/user", (req, res) => {
        if (!req.isAuthenticated()) return res.sendStatus(401);
        res.json(req.user);
    });
}
