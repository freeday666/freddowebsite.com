/**
 * Freddo Bot Hosting — starter backend
 * Node.js 20+
 *
 * Setup:
 *   npm init -y
 *   npm install express socket.io express-session passport passport-discord passport-google-oauth20 dotenv helmet express-rate-limit discord.js
 *   node server.js
 *
 * Configure .env before enabling OAuth or real bot actions.
 * Never expose Discord bot tokens or OAuth secrets in public HTML/JS.
 */
require("dotenv").config();

const express = require("express");
const http = require("http");
const path = require("path");
const session = require("express-session");
const passport = require("passport");
const DiscordStrategy = require("passport-discord").Strategy;
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = Number(process.env.PORT || 3000);
const SESSION_SECRET = process.env.SESSION_SECRET;

if (!SESSION_SECRET) {
  console.warn("⚠️ SESSION_SECRET ontbreekt. Stel dit in je .env in voordat je publiek host.");
}

app.set("trust proxy", 1);
app.use(helmet({
  // Allows the inline styling used by this starter HTML. Tighten CSP before production.
  contentSecurityPolicy: false
}));
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: false }));
app.use(rateLimit({ windowMs: 60_000, limit: 180, standardHeaders: true, legacyHeaders: false }));

app.use(session({
  name: "freddo.sid",
  secret: SESSION_SECRET || "dev-only-change-this-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
}));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

if (process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET && process.env.DISCORD_CALLBACK_URL) {
  passport.use("discord", new DiscordStrategy({
    clientID: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    callbackURL: process.env.DISCORD_CALLBACK_URL,
    scope: ["identify", "guilds"]
  }, (accessToken, refreshToken, profile, done) => {
    // Production: upsert this identity in a database. Do not store access tokens unless needed.
    done(null, {
      id: `discord:${profile.id}`,
      provider: "discord",
      displayName: profile.global_name || profile.username,
      username: profile.username,
      avatar: profile.avatar
        ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`
        : null
    });
  }));
}

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_CALLBACK_URL) {
  passport.use("google", new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
  }, (accessToken, refreshToken, profile, done) => {
    // Production: upsert this identity in a database.
    done(null, {
      id: `google:${profile.id}`,
      provider: "google",
      displayName: profile.displayName,
      email: profile.emails?.[0]?.value || null,
      avatar: profile.photos?.[0]?.value || null
    });
  }));
}

app.get("/auth/discord", (req, res, next) => {
  if (!process.env.DISCORD_CLIENT_ID) return res.status(503).send("Discord OAuth is not configured. Set DISCORD_* values in .env.");
  passport.authenticate("discord")(req, res, next);
});
app.get("/auth/discord/callback", (req, res, next) => {
  passport.authenticate("discord", { failureRedirect: "/?login=failed" })(req, res, next);
}, (req, res) => res.redirect("/"));

app.get("/auth/google", (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID) return res.status(503).send("Google OAuth is not configured. Set GOOGLE_* values in .env.");
  passport.authenticate("google", { scope: ["profile", "email"] })(req, res, next);
});
app.get("/auth/google/callback", (req, res, next) => {
  passport.authenticate("google", { failureRedirect: "/?login=failed" })(req, res, next);
}, (req, res) => res.redirect("/"));

app.post("/auth/logout", (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    req.session.destroy(() => res.json({ ok: true }));
  });
});

function requireLogin(req, res, next) {
  if (!req.isAuthenticated?.() || !req.user) {
    return res.status(401).json({ error: "Log eerst in." });
  }
  next();
}

app.get("/api/me", (req, res) => {
  res.json({ user: req.user || null });
});

/**
 * Demo data only. Replace this in-memory store with a persistent database
 * and enforce per-user ownership on every read/write in production.
 */
const botsByUser = new Map();
const logsByBot = new Map();

function getUserBots(userId) {
  if (!botsByUser.has(userId)) {
    botsByUser.set(userId, [
      { id: "demo-guardian", name: "Guardian", status: "online", guild: "Community Hub", members: 1248, mode: "demo" },
      { id: "demo-welcome", name: "Welcome Bot", status: "stopped", guild: "Creator Lounge", members: 386, mode: "demo" }
    ]);
  }
  return botsByUser.get(userId);
}

app.get("/api/bots", requireLogin, (req, res) => {
  res.json({ bots: getUserBots(req.user.id) });
});

app.post("/api/bots", requireLogin, (req, res) => {
  const name = String(req.body?.name || "").trim().slice(0, 50);
  if (!name) return res.status(400).json({ error: "Geef de bot een naam." });
  const bots = getUserBots(req.user.id);
  const bot = {
    id: `bot-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name,
    status: "stopped",
    guild: "Niet gekoppeld",
    members: 0,
    mode: "setup"
  };
  bots.push(bot);
  res.status(201).json({ bot });
});

app.post("/api/bots/:id/action", requireLogin, (req, res) => {
  const action = String(req.body?.action || "");
  if (!["start", "stop", "restart"].includes(action)) {
    return res.status(400).json({ error: "Ongeldige actie." });
  }
  const bot = getUserBots(req.user.id).find(item => item.id === req.params.id);
  if (!bot) return res.status(404).json({ error: "Bot niet gevonden." });

  // This starter changes dashboard state only. Real execution needs a persistent worker,
  // a safely stored bot token, and process supervision. Never execute arbitrary shell input.
  bot.status = action === "stop" ? "stopped" : "online";
  bot.mode = "demo";
  const entry = {
    time: new Date().toISOString(),
    level: "INFO",
    message: `[DEMO] ${bot.name}: ${action} aangevraagd — koppel een echte worker om dit uit te voeren.`
  };
  const key = `${req.user.id}:${bot.id}`;
  const logs = logsByBot.get(key) || [];
  logs.push(entry);
  logsByBot.set(key, logs.slice(-200));
  io.to(key).emit("console:log", entry);
  io.to(key).emit("bot:status", { id: bot.id, status: bot.status });
  res.json({ bot, message: "Dashboardstatus bijgewerkt (demo; geen echt botproces gestart)." });
});

app.get("/api/bots/:id/logs", requireLogin, (req, res) => {
  const bot = getUserBots(req.user.id).find(item => item.id === req.params.id);
  if (!bot) return res.status(404).json({ error: "Bot niet gevonden." });
  res.json({ logs: logsByBot.get(`${req.user.id}:${bot.id}`) || [] });
});

app.post("/api/bots/:id/console", requireLogin, (req, res) => {
  const bot = getUserBots(req.user.id).find(item => item.id === req.params.id);
  if (!bot) return res.status(404).json({ error: "Bot niet gevonden." });
  const command = String(req.body?.command || "").trim().slice(0, 160);
  if (!command) return res.status(400).json({ error: "Typ een consolebericht." });

  // Safe demo console: intentionally does not run OS commands or execute arbitrary code.
  const entry = {
    time: new Date().toISOString(),
    level: "USER",
    message: `> ${command}  [demo-console: niet uitgevoerd]`
  };
  const key = `${req.user.id}:${bot.id}`;
  const logs = logsByBot.get(key) || [];
  logs.push(entry);
  logsByBot.set(key, logs.slice(-200));
  io.to(key).emit("console:log", entry);
  res.json({ ok: true, entry });
});

app.get("/api/features", (req, res) => {
  res.json({
    oauth: {
      discord: Boolean(process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET && process.env.DISCORD_CALLBACK_URL),
      google: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_CALLBACK_URL)
    },
    botWorkerConfigured: Boolean(process.env.BOT_WORKER_URL),
    databaseConfigured: Boolean(process.env.DATABASE_URL),
    note: "Bots en logs zijn in-memory demo-data. Configureer database en een persistent worker voor productie."
  });
});

io.on("connection", socket => {
  socket.on("console:subscribe", ({ botId } = {}) => {
    // Verify session before joining a user-specific room.
    const req = socket.request;
    const user = req.session?.passport?.user;
    if (!user || !botId) return;
    const bots = getUserBots(user.id);
    if (!bots.some(bot => bot.id === botId)) return;
    socket.join(`${user.id}:${botId}`);
  });
});

app.use(express.static(path.join(__dirname, "public")));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Er ging iets mis op de server." });
});

server.listen(PORT, () => {
  console.log(`Freddo Bot Hosting draait op http://localhost:${PORT}`);
});
