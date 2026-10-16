const express = require("express");
const session = require("express-session");

const app = express();
const PORT = process.env.PORT || 3000;

const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const REDIRECT_URI =
  process.env.DISCORD_REDIRECT_URI || `http://localhost:${PORT}/callback`;

if (!CLIENT_ID || !CLIENT_SECRET) {
  throw new Error("Stel DISCORD_CLIENT_ID en DISCORD_CLIENT_SECRET in.");
}

app.use(session({
  secret: process.env.SESSION_SECRET || "vervang-dit-door-een-lange-willekeurige-string",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 24 * 60 * 60 * 1000
  }
}));

app.use(express.static("public"));

app.get("/login", (req, res) => {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: "identify"
  });

  res.redirect(`https://discord.com/oauth2/authorize?${params}`);
});

app.get("/callback", async (req, res) => {
  const code = req.query.code;
  if (typeof code !== "string") {
    return res.status(400).send("Discord heeft geen autorisatiecode teruggestuurd.");
  }

  try {
    const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
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

    const tokens = await tokenResponse.json();
    if (!tokenResponse.ok) {
      console.error("Tokenfout:", tokens);
      return res.status(400).send("Discord-login is mislukt. Controleer je instellingen.");
    }

    const userResponse = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });

    const user = await userResponse.json();
    if (!userResponse.ok) {
      console.error("Gebruikersfout:", user);
      return res.status(400).send("Discord-gebruikersgegevens ophalen is mislukt.");
    }

    req.session.user = {
      id: user.id,
      username: user.username,
      global_name: user.global_name
    };

    res.redirect("/");
  } catch (error) {
    console.error(error);
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
  req.session.destroy(() => res.sendStatus(204));
});

app.listen(PORT, () => {
  console.log(`Server draait op http://localhost:${PORT}`);
});