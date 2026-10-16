// server.js
// Node.js 18+
// npm install express dotenv

require("dotenv").config();

const express = require("express");
const app = express();

const PORT = process.env.PORT || 3000;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const REDIRECT_URI = process.env.DISCORD_REDIRECT_URI;

if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
  console.error(
    "Vul DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET en DISCORD_REDIRECT_URI in."
  );
  process.exit(1);
}

app.get("/login", (req, res) => {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: "code",
    redirect_uri: REDIRECT_URI,
    scope: "identify guilds.join",
  });

  res.redirect(`https://discord.com/oauth2/authorize?${params}`);
});

app.get("/callback", async (req, res) => {
  const { code, error } = req.query;

  if (error) {
    return res.status(400).send("Discord-aanmelding geannuleerd of mislukt.");
  }

  if (!code) {
    return res.status(400).send("Geen OAuth-code ontvangen.");
  }

  try {
    const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: "authorization_code",
        code: String(code),
        redirect_uri: REDIRECT_URI,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error("Discord tokenfout:", tokenData);
      return res.status(502).send("Discord-aanmelding kon niet worden afgerond.");
    }

    // Haal alleen de gebruikersinformatie op die nodig is.
    const userResponse = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const user = await userResponse.json();

    if (!userResponse.ok) {
      console.error("Discord gebruikersfout:", user);
      return res.status(502).send("Discord-gebruikersgegevens ophalen mislukt.");
    }

    // Voeg hier eventueel server-side sessiebeheer toe.
    // Stuur access tokens nooit naar de browser of naar publieke GitHub-code.
    res
      .status(200)
      .type("html")
      .send(`<!doctype html>
<html lang="nl">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>Welkom bij Nova</title>
<style>
body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0b0b12;color:#f4f3fa;font:16px system-ui,sans-serif}
main{text-align:center;padding:40px;border:1px solid #292638;border-radius:20px;background:#151420}
h1{margin-bottom:8px}p{color:#aaa}
</style></head>
<body><main><h1>Welkom bij Nova, ${escapeHtml(user.username)}!</h1>
<p>Je Discord-account is verbonden.</p></main></body></html>`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Er ging iets mis tijdens het aanmelden.");
  }
});

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char]);
}

app.listen(PORT, () => {
  console.log(`Nova OAuth-server draait op poort ${PORT}`);
});
