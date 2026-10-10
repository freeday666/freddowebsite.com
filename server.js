"use strict";

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const Database = require("better-sqlite3");
const OpenAI = require("openai");
const archiver = require("archiver");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const JWT_SECRET = process.env.JWT_SECRET;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  console.error("Fout: zet een JWT_SECRET van minimaal 32 tekens in .env");
  process.exit(1);
}

if (!OPENAI_API_KEY) {
  console.error("Fout: zet OPENAI_API_KEY in .env");
  process.exit(1);
}

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || "http://localhost:3000",
  credentials: true
}));
app.use(express.json({ limit: "1mb" }));

const db = new Database(process.env.DB_PATH || "nova.sqlite");
db.pragma("journal_mode = WAL");
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id INTEGER NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(conversation_id) REFERENCES conversations(id)
  );
`);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Te veel pogingen. Probeer het later opnieuw." }
});

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Je verstuurt te snel berichten. Wacht even." }
});

function createToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";

  if (!token) {
    return res.status(401).json({ error: "Log in om deze functie te gebruiken." });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Ongeldige of verlopen sessie." });
  }
}

function cleanEmail(value) {
  return String(value || "").trim().toLowerCase();
}

/* Health check */
app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "Nova API" });
});

/* Account aanmaken */
app.post("/api/auth/register", authLimiter, async (req, res) => {
  try {
    const email = cleanEmail(req.body.email);
    const password = String(req.body.password || "");

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Vul een geldig e-mailadres in." });
    }

    if (password.length < 8 || password.length > 128) {
      return res.status(400).json({
        error: "Je wachtwoord moet minimaal 8 en maximaal 128 tekens bevatten."
      });
    }

    const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
    if (existing) {
      return res.status(409).json({ error: "Er bestaat al een account met dit e-mailadres." });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const result = db.prepare(
      "INSERT INTO users (email, password_hash) VALUES (?, ?)"
    ).run(email, passwordHash);

    const user = { id: Number(result.lastInsertRowid), email };
    res.status(201).json({
      token: createToken(user),
      user
    });
  } catch (error) {
    console.error("Registratiefout:", error);
    res.status(500).json({ error: "Account aanmaken is mislukt." });
  }
});

/* Inloggen */
app.post("/api/auth/login", authLimiter, async (req, res) => {
  try {
    const email = cleanEmail(req.body.email);
    const password = String(req.body.password || "");

    const user = db.prepare(
      "SELECT id, email, password_hash FROM users WHERE email = ?"
    ).get(email);

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: "E-mailadres of wachtwoord is onjuist." });
    }

    res.json({
      token: createToken(user),
      user: { id: user.id, email: user.email }
    });
  } catch (error) {
    console.error("Inlogfout:", error);
    res.status(500).json({ error: "Inloggen is mislukt." });
  }
});

/* Huidige gebruiker */
app.get("/api/auth/me", requireAuth, (req, res) => {
  res.json({ user: { id: req.user.id, email: req.user.email } });
});

/* AI-chat */
app.post("/api/chat", requireAuth, chatLimiter, async (req, res) => {
  try {
    const message = String(req.body.message || "").trim();
    let conversationId = Number(req.body.conversationId) || null;

    if (!message || message.length > 12000) {
      return res.status(400).json({
        error: "Je bericht moet tussen 1 en 12.000 tekens bevatten."
      });
    }

    if (conversationId) {
      const conversation = db.prepare(
        "SELECT id FROM conversations WHERE id = ? AND user_id = ?"
      ).get(conversationId, req.user.id);

      if (!conversation) {
        return res.status(404).json({ error: "Chat niet gevonden." });
      }
    } else {
      const title = message.slice(0, 70);
      const result = db.prepare(
        "INSERT INTO conversations (user_id, title) VALUES (?, ?)"
      ).run(req.user.id, title);

      conversationId = Number(result.lastInsertRowid);
    }

    const previousMessages = db.prepare(`
      SELECT role, content
      FROM messages
      WHERE conversation_id = ?
      ORDER BY id DESC
      LIMIT 20
    `).all(conversationId).reverse();

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Je bent Nova, een behulpzame AI-assistent. Antwoord duidelijk in de taal van de gebruiker. " +
            "Bij programmeervragen geef je bruikbare code en vermeld je belangrijke installatie- of veiligheidsstappen."
        },
        ...previousMessages.map(item => ({
          role: item.role,
          content: item.content
        })),
        { role: "user", content: message }
      ],
      temperature: 0.7
    });

    const answer = response.choices?.[0]?.message?.content?.trim();

    if (!answer) {
      return res.status(502).json({ error: "De AI gaf geen antwoord terug." });
    }

    const insertMessage = db.prepare(
      "INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)"
    );

    const saveMessages = db.transaction(() => {
      insertMessage.run(conversationId, "user", message);
      insertMessage.run(conversationId, "assistant", answer);
    });
    saveMessages();

    res.json({ answer, conversationId });
  } catch (error) {
    console.error("Chatfout:", error);

    if (error.status === 429) {
      return res.status(429).json({ error: "De AI-dienst is druk. Probeer het straks opnieuw." });
    }

    res.status(500).json({ error: "De AI-chat is tijdelijk niet beschikbaar." });
  }
});

/* Chats van de ingelogde gebruiker */
app.get("/api/conversations", requireAuth, (req, res) => {
  const conversations = db.prepare(`
    SELECT id, title, created_at AS createdAt
    FROM conversations
    WHERE user_id = ?
    ORDER BY id DESC
    LIMIT 100
  `).all(req.user.id);

  res.json({ conversations });
});

/* Berichten van één chat */
app.get("/api/conversations/:id/messages", requireAuth, (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "Ongeldig chatnummer." });
  }

  const conversation = db.prepare(
    "SELECT id FROM conversations WHERE id = ? AND user_id = ?"
  ).get(id, req.user.id);

  if (!conversation) {
    return res.status(404).json({ error: "Chat niet gevonden." });
  }

  const messages = db.prepare(`
    SELECT role, content, created_at AS createdAt
    FROM messages
    WHERE conversation_id = ?
    ORDER BY id ASC
  `).all(id);

  res.json({ messages });
});

/* ZIP-bestand maken van aangeleverde tekstbestanden */
app.post("/api/files/zip", requireAuth, (req, res) => {
  const files = req.body.files;

  if (!Array.isArray(files) || files.length === 0 || files.length > 30) {
    return res.status(400).json({
      error: "Stuur tussen 1 en 30 bestanden mee."
    });
  }

  const safeFiles = [];

  for (const file of files) {
    const name = String(file?.name || "");
    const content = String(file?.content || "");

    // Alleen eenvoudige bestandsnamen toestaan; geen paden of ../
    if (
      !name ||
      name.length > 100 ||
      name.includes("..") ||
      name.includes("/") ||
      name.includes("\\") ||
      !/^[a-zA-Z0-9._-]+$/.test(name)
    ) {
      return res.status(400).json({ error: "Een bestandsnaam is ongeldig." });
    }

    if (content.length > 500_000) {
      return res.status(400).json({ error: "Een bestand is te groot." });
    }

    safeFiles.push({ name, content });
  }

  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", 'attachment; filename="nova-project.zip"');

  const archive = archiver("zip", { zlib: { level: 9 } });

  archive.on("error", error => {
    console.error("ZIP-fout:", error);
    if (!res.headersSent) res.status(500).end("ZIP maken is mislukt.");
    else res.destroy(error);
  });

  archive.pipe(res);
  for (const file of safeFiles) {
    archive.append(file.content, { name: file.name });
  }
  archive.finalize();
});

/* Frontend serveren vanuit ./public */
const publicDir = path.join(__dirname, "public");
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
  app.get("/", (req, res) => {
    res.sendFile(path.join(publicDir, "index.html"));
  });
}

app.use((req, res) => {
  res.status(404).json({ error: "Endpoint niet gevonden." });
});

app.listen(PORT, () => {
  console.log(`Nova server draait op http://localhost:${PORT}`);
});
