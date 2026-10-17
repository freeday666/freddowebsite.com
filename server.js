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
  origin: true, // Accepteert lokaal elke Live Server poort of bestand
  credentials: true
}));

app.use(session({
  secret: process.env.SESSION_SECRET || 'geheim_sleutel_verander_dit',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, // Zet op true als je HTTPS gebruikt
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 1 dag
  }
}));

// In-memory dataopslag (voor productie koppel je hier een database zoals MongoDB of PostgreSQL aan)
const users = []; 
const tickets = []; 
let botSettings = {
  prefix: '.',
  welcome: true,
  spam: true,
  links: false,
  logs: true
};

// --- AUTHENTICATIE ---

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

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
});

app.get('/api/auth/me', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Niet ingelogd.' });
  }
  const user = users.find(u => u.id === req.session.userId);
  if (!user) return res.status(401).json({ error: 'Gebruiker niet gevonden.' });

  res.json({ user: { email: user.email, name: user.name } });
});

// Middleware voor beveiligde routes
function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Niet geautoriseerd.' });
  }
  next();
}

// --- INSTELLINGEN & BOT ---

app.get('/api/settings', requireAuth, (req, res) => {
  res.json(botSettings);
});

app.post('/api/settings', requireAuth, (req, res) => {
  const { prefix, settings } = req.body;
  if (prefix) botSettings.prefix = prefix.slice(0, 5);
  if (settings) {
    botSettings = { ...botSettings, ...settings };
  }
  res.json({ success: true, botSettings });
});

// --- AI CHAT ---

app.post('/api/ai/chat', requireAuth, async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Bericht is verplicht.' });

  // Hier kun je evt. OpenAI of een andere API koppelen
  const reply = `Nova AI Backend antwoord op: "${message}".`;
  res.json({ reply });
});

// --- TICKETS ---

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

app.listen(PORT, () => {
  console.log(`Nova Panel backend draait op http://localhost:${PORT}`);
});
