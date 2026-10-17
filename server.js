require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: 'http://localhost:5500', // Pas aan naar de URL van je frontend (Live Server / poort)
  credentials: true
}));

app.use(session({
  secret: process.env.SESSION_SECRET || 'geheim_sleutel_verander_dit',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, // Zet op true als je HTTPS gebruikt in productie
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 1 dag
  }
}));

// In-memory database (vervang dit in productie voor MongoDB, PostgreSQL of MySQL)
const users = []; // { id, email, passwordHash, name }
const tickets = []; // { id, userId, subject, status, createdAt }
let botSettings = {
  prefix: '.',
  welcome: true,
  spam: true,
  links: false,
  logs: true
};

// --- AUTHENTICATIE ROUTES ---

// Registreren
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'E-mail en wachtwoord zijn verplicht.' });
    }

    const existingUser = users.find(u => u.email === email.toLowerCase());
    if (existingUser) {
      return res.status(400).json({ error: 'Dit e-mailadres is al in gebruik.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: Date.now().toString(),
      email: email.toLowerCase(),
      passwordHash: hashedPassword,
      name: name || email.split('@')[0]
    };

    users.push(newUser);
    req.session.userId = newUser.id;

    res.json({ success: true, user: { email: newUser.email, name: newUser.name } });
  } catch (err) {
    res.status(500).json({ error: 'Serverfout bij registreren.' });
  }
});

// Inloggen
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email?.toLowerCase());

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Ongeldige inloggegevens.' });
    }

    req.session.userId = user.id;
    res.json({ success: true, user: { email: user.email, name: user.name } });
  } catch (err) {
    res.status(500).json({ error: 'Serverfout bij inloggen.' });
  }
});

// Uitloggen
app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
});

// Huidige sessie opvragen
app.get('/api/auth/me', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Niet ingelogd.' });
  }
  const user = users.find(u => u.id === req.session.userId);
  if (!user) return res.status(401).json({ error: 'Gebruiker niet gevonden.' });

  res.json({ user: { email: user.email, name: user.name } });
});

// --- BEVEILIGINGS-MIDDLEWARE VOOR PANEEL ---
function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Niet geautoriseerd. Log eerst in.' });
  }
  next();
}

// --- DASHBOARD & BOT ROUTES ---

// Bot instellingen ophalen
app.get('/api/settings', requireAuth, (req, res) => {
  res.json(botSettings);
});

// Bot instellingen opslaan (Prefix & Moderatie schakelaars)
app.post('/api/settings', requireAuth, (req, res) => {
  const { prefix, settings } = req.body;
  if (prefix) botSettings.prefix = prefix.slice(0, 5);
  if (settings) {
    botSettings = { ...botSettings, ...settings };
  }
  res.json({ success: true, botSettings });
});

// --- AI CHAT (Backend koppeling voorbeeld met OpenAI / Ollama) ---
app.post('/api/ai/chat', requireAuth, async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Bericht is verplicht.' });

  try {
    // Voorbeeld: Hier kun je fetch('https://api.openai.com/v1/chat/completions', ...) aanroepen
    // Zorg dat je OpenAI API key veilig in je .env bestand staat.
    
    // Voor nu sturen we een slim gegenereerd backend-antwoord terug:
    const reply = `Backend AI antwoord op: "${message}". (Dit kun je koppelen aan OpenAI, Claude of een lokale LLM).`;
    res.json({ reply });
  } catch (err) {
    res.status(500).json({ error: 'Fout bij communiceren met AI.' });
  }
});

// --- TICKETS ROUTES ---
app.get('/api/tickets', requireAuth, (req, res) => {
  const userTickets = tickets.filter(t => t.userId === req.session.userId);
  res.json(userTickets);
});

app.post('/api/tickets', requireAuth, (req, res) => {
  const { subject } = req.body;
  if (!subject) return res.status(400).json({ error: 'Onderwerp is verplicht.' });

  const newTicket = {
    id: 'TICK-' + Math.floor(1000 + Math.random() * 9000),
    userId: req.session.userId,
    subject,
    status: 'open',
    createdAt: new Date().toISOString()
  };

  tickets.push(newTicket);
  res.json({ success: true, ticket: newTicket });
});

// Start server
app.listen(PORT, () => {
  console.log(`Nova Panel backend draait op http://localhost:${PORT}`);
});
