"use strict";

const express = require("express");
const session = require("express-session");
const crypto = require("node:crypto");

const app = express();

const {
  CLIENT_ID,
  CLIENT_SECRET,
  SESSION_SECRET,
  BASE_URL,
  PORT = 3000
} = process.env;

if (!CLIENT_ID || !CLIENT_SECRET || !SESSION_SECRET || !BASE_URL) {
  throw new Error(
    "Stel CLIENT_ID, CLIENT_SECRET, SESSION_SECRET en BASE_URL in."
  );
}

const REDIRECT_URI = `${BASE_URL.replace(/\/$/, "")}/callback`;
const SITE_URL = "https://freeday666.github.io/freddowebsite.com/";

app.set("trust proxy", 1);

app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true, // Vereist HTTPS; gebruik lokaal NODE_ENV=development en pas dit aan.
      sameSite: "lax",
      maxAge: 10 * 60 * 1000
    }
  })
);

app.get("/login", (req, res) => {
  const state = crypto.randomBytes(24).toString("hex");
  req.session.oauthState = state;

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: "code",
    redirect_uri: REDIRECT_URI,
    scope: "identify guilds.join",
    state
  });

  res.redirect(`https://discord.com/oauth2/authorize?${params}`);
});

app.get("/callback", async (req, res) => {
  const { code, state, error } = req.query;

  if (error) {
    return res.status(400).send(`Discord login error: ${String(error)}`);
  }

  if (
    typeof code !== "string" ||
    typeof state !== "string" ||
    !req.session.oauthState ||
    state !== req.session.oauthState
  ) {
    return res.status(400).send("Ongeldige of verlopen login-aanvraag.");
  }

  delete req.session.oauthState;

  try {
    const tokenResponse = await fetch("https://discord.com/api/v10/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI
      })
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error("Discord token exchange failed:", tokenData);
      return res.status(502).send("Discord-login kon niet worden afgerond.");
    }

    const userResponse = await fetch("https://discord.com/api/v10/users/@me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });

    const user = await userResponse.json();

    if (!userResponse.ok) {
      console.error("Discord user request failed:", user);
      return res.status(502).send("Kon Discord-gebruiker niet ophalen.");
    }

    // Bewaar alleen noodzakelijke gebruikersinformatie in de sessie.
    req.session.user = {
      id: user.id,
      username: user.username,
      global_name: user.global_name ?? null,
      avatar: user.avatar ?? null
    };

    req.session.save((err) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Sessie opslaan is mislukt.");
      }

      res.redirect(`${SITE_URL}?login=success`);
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Er ging iets mis tijdens het inloggen.");
  }
});

app.get("/me", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Niet ingelogd" });
  }

  res.json(req.session.user);
});

app.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.status(204).end();
  });
});

app.listen(PORT, () => {
  console.log(`Server draait op poort ${PORT}`);
  console.log(`Discord callback: ${REDIRECT_URI}`);
});
