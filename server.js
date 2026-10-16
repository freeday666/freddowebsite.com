const express = require("express");
const app = express();

const CLIENT_ID = "1546170500282064976";
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const REDIRECT_URI = "http://localhost:3000/callback";

app.use(express.static("public"));

app.get("/callback", async (req, res) => {
  if (!CLIENT_SECRET) return res.status(500).send("DISCORD_CLIENT_SECRET ontbreekt.");

  const code = req.query.code;
  if (typeof code !== "string") return res.status(400).send("Discord-code ontbreekt.");

  try {
    const response = await fetch("https://discord.com/api/oauth2/token", {
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

    const data = await response.json();
    if (!response.ok) {
      console.error(data);
      return res.status(400).send("Discord-login mislukt. Controleer OAuth-instellingen.");
    }

    const userResponse = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${data.access_token}` }
    });
    const user = await userResponse.json();

    if (!userResponse.ok) return res.status(400).send("Profiel ophalen mislukt.");

    res.send(`<!doctype html>
      <html lang="nl"><meta charset="utf-8">
      <title>Ingelogd</title>
      <h1>Ingelogd als ${escapeHtml(user.global_name || user.username)}</h1>
      <p>Je Discord-login is gelukt.</p></html>`);
  } catch (error) {
    console.error(error);
    res.status(500).send("Serverfout tijdens inloggen.");
  }
});

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[c]);
}

app.listen(3000, () => console.log("Open http://localhost:3000"));