const express = require("express");
const { Client, GatewayIntentBits } = require("discord.js");

const app = express();
app.use(express.json());
app.use(express.static("public"));

const token = process.env.DISCORD_TOKEN;
if (!token) {
  console.error("DISCORD_TOKEN ontbreekt. Stel deze in als omgevingsvariabele.");
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once("ready", () => {
  console.log(`Bot online als ${client.user.tag}`);
});

client.login(token).catch(error => {
  console.error("Inloggen bij Discord mislukt:", error.message);
  process.exit(1);
});

app.get("/api/status", (req, res) => {
  res.json({
    online: client.isReady(),
    username: client.user?.tag ?? null
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Dashboard draait op poort ${port}`));