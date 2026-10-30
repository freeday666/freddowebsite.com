require('dotenv').config();
const express = require('express');
const path = require('path');
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Server In-Memory State
let serverState = {
  id: "srv-freddo-01",
  name: "Freddo Core Node - Amsterdam",
  status: "online", // online, offline, restarting
  cpu: 14,
  ram: 2.1,
  disk: 18.4,
  uptime: 0
};

let logs = [
  { timestamp: new Date().toLocaleTimeString(), text: "Freddo Daemon Core v3.0 initialized." },
  { timestamp: new Date().toLocaleTimeString(), text: `HTTP Server listening on port ${PORT}` },
  { timestamp: new Date().toLocaleTimeString(), text: "Real-time SSE stream channel established." }
];

// Clients die luisteren naar real-time updates (SSE)
let sseClients = [];

function broadcast(event, data) {
  sseClients.forEach(client => {
    client.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  });
}

function addLog(text) {
  const timestamp = new Date().toLocaleTimeString();
  const logEntry = { timestamp, text };
  logs.push(logEntry);
  if (logs.length > 100) logs.shift(); // Houd maximale logomvang beperkt
  broadcast('log', logEntry);
}

// Uptime & Metric simulatie loop (Elke 2 seconden)
setInterval(() => {
  if (serverState.status === 'online') {
    serverState.uptime += 2;
    serverState.cpu = Math.floor(10 + Math.random() * 25);
    serverState.ram = parseFloat((2.0 + Math.random() * 0.5).toFixed(1));
  } else {
    serverState.cpu = 0;
    serverState.ram = 0;
  }
  broadcast('stats', serverState);
}, 2000);

// SSE Endpoint voor real-time verbinding
app.get('/api/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Stuur initiële state direct mee
  res.write(`event: stats\ndata: ${JSON.stringify(serverState)}\n\n`);

  sseClients.push(res);

  req.on('close', () => {
    sseClients = sseClients.filter(c => c !== res);
  });
});

// API Routes
app.get('/api/server/status', (req, res) => {
  res.json(serverState);
});

app.get('/api/server/logs', (req, res) => {
  res.json(logs);
});

app.post('/api/server/action', (req, res) => {
  const { action } = req.body;

  if (action === 'start') {
    serverState.status = 'online';
    addLog("Command received: START. Booting up server nodes...");
    addLog("Server successfully started and listening.");
  } else if (action === 'stop') {
    serverState.status = 'offline';
    addLog("Command received: STOP. Shutting down services safely...");
    addLog("Server is now offline.");
  } else if (action === 'restart') {
    serverState.status = 'restarting';
    addLog("Command received: RESTART. Rebooting system...");
    setTimeout(() => {
      serverState.status = 'online';
      addLog("System reboot complete. All services online.");
      broadcast('stats', serverState);
    }, 3500);
  }

  broadcast('stats', serverState);
  res.json({ success: true, status: serverState.status });
});

app.post('/api/server/command', (req, res) => {
  const { command } = req.body;
  addLog(`$ ${command}`);

  let responseText = `Executed: '${command}'`;
  const cmd = command.toLowerCase().trim();

  if (cmd === 'help') {
    responseText = "Available commands: help, status, ping, clear, sysinfo, uptime";
  } else if (cmd === 'status') {
    responseText = `Status: ${serverState.status.toUpperCase()} | CPU: ${serverState.cpu}% | RAM: ${serverState.ram}GB`;
  } else if (cmd === 'ping') {
    responseText = "Pong! Latency: 8ms (Node cluster optimal)";
  } else if (cmd === 'sysinfo') {
    responseText = "Freddo OS v3.2-release | Architecture: x64-docker | Node.js runtime active";
  } else if (cmd === 'uptime') {
    responseText = `Server Uptime: ${Math.floor(serverState.uptime / 60)}m ${serverState.uptime % 60}s`;
  }

  addLog(responseText);
  res.json({ success: true, response: responseText });
});

// --- DISCORD BOT INTEGRATIE ---
if (process.env.DISCORD_BOT_TOKEN && process.env.DISCORD_BOT_TOKEN !== 'jouw_echte_discord_bot_token_hier') {
  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
  });

  client.once('ready', async () => {
    console.log(`🤖 Discord Bot succesvol ingelogd als ${client.user.tag}`);

    // Registreer Slash Commands
    const commands = [
      new SlashCommandBuilder()
        .setName('server')
        .setDescription('Bekijk de real-time status van Freddo Hosting')
    ].map(command => command.toJSON());

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);
    try {
      if (process.env.CLIENT_ID) {
        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
        console.log('✨ Discord Slash commands succesvol geregistreerd!');
      }
    } catch (error) {
      console.error('Fout bij registreren Discord commands:', error);
    }
  });

  client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName === 'server') {
      await interaction.reply({
        content: `❄️ **Freddo Hosting Status**\n- **Status:** \`${serverState.status.toUpperCase()}\`\n- **CPU:** \`${serverState.cpu}%\`\n- **RAM:** \`${serverState.ram} GB\``,
        ephemeral: false
      });
    }
  });

  client.login(process.env.DISCORD_BOT_TOKEN).catch(err => {
    console.error('Kon niet inloggen met Discord Bot Token:', err.message);
  });
} else {
  console.log('⚠️ Geen geldige DISCORD_BOT_TOKEN gevonden in .env. Bot is overgeslagen.');
}

// Start HTTP Server
app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`❄️ Freddo Hosting Dashboard draait op poort ${PORT}`);
  console.log(`🌐 Open in je browser: http://localhost:${PORT}`);
  console.log(`==================================================`);
});
