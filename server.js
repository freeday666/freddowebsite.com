require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5500', // Pas aan naar je GitHub Pages URL in productie
  credentials: true
}));

app.use(session({
  secret: process.env.SESSION_SECRET || 'geheim_sleutel',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production', // True op HTTPS
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// In-memory data
const tickets = [];
let botSettings = { prefix: '.', welcome: true, spam: true, links: false, logs: true };

// Passport GitHub Configuratie
passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: process.env.GITHUB_CALLBACK_URL || "http://localhost:3000/auth/github/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    // Hier koppel je de GitHub profieldata aan je sessie
    return done(null, {
      id: profile.id,
      name: profile.displayName || profile.username,
      email: profile.emails?.[0]?.value || `${profile.username}@github.user`,
      avatar: profile.photos?.[0]?.value
    });
  }
));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// --- ROUTES ---

// Start GitHub login
app.get('/auth/github', passport.authenticate('github', { scope: ['user:email'] }));

// GitHub callback
app.get('/auth/github/callback', 
  passport.authenticate('github', { failureRedirect: '/' }),
  (req, res) => {
    // Redirect terug naar je frontend dashboard na succesvolle login
    res.redirect(process.env.FRONTEND_URL || 'http://localhost:5500');
  }
);

// Huidige gebruiker opvragen
app.get('/api/auth/me', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Niet ingelogd.' });
  }
  res.json({ user: req.user });
});

// Uitloggen
app.post('/api/auth/logout', (req, res) => {
  req.logout((err) => {
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
});

// Middleware check
function ensureAuth(req, res, next) {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'Niet geautoriseerd.' });
  next();
}

// Bot instellingen
app.get('/api/settings', ensureAuth, (req, res) => res.json(botSettings));
app.post('/api/settings', ensureAuth, (req, res) => {
  const { prefix, settings } = req.body;
  if (prefix) botSettings.prefix = prefix.slice(0, 5);
  if (settings) botSettings = { ...botSettings, ...settings };
  res.json({ success: true, botSettings });
});

// AI Chat
app.post('/api/ai/chat', ensureAuth, (req, res) => {
  const { message } = req.body;
  res.json({ reply: `GitHub AI antwoord op: "${message}"` });
});

// Tickets
app.get('/api/tickets', ensureAuth, (req, res) => {
  const userTickets = tickets.filter(t => t.userId === req.user.id);
  res.json(userTickets);
});

app.post('/api/tickets', ensureAuth, (req, res) => {
  const { subject } = req.body;
  const newTicket = { id: 'TICK-' + Math.floor(1000 + Math.random() * 9000), userId: req.user.id, subject, status: 'open' };
  tickets.push(newTicket);
  res.json({ success: true, ticket: newTicket });
});

app.listen(PORT, () => console.log(`Backend draait op poort ${PORT}`));
