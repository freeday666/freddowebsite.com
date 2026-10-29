const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware voor JSON verwerking
app.use(express.json());

// Serveer statische bestanden uit de huidige map
app.use(express.static(path.join(__dirname)));

// Server Status In-Memory State
let serverState = {
  id: "srv-01",
  name: "Freddo Main Server",
  status: "online", // online, offline, restarting
  cpu: 18,
  ram: 2.4,
  disk: 14.2,
  uptime: 0
};

// Logs geheugen
let logs = [
  { timestamp: new Date().toLocaleTimeString(), text: "Freddo Hosting Server Daemon v2.4 initialized." },
  { timestamp: new Date().toLocaleTimeString(), text: "Listening on port " + PORT },
  { timestamp: new Date().toLocaleTimeString(), text: "Connected to Freddo Node #1 (Amsterdam)." }
];

// Timer om uptime & stats te simuleren
setInterval(() => {
  if (serverState.status === 'online') {
    serverState.uptime += 1;
    // Kleine willekeurige schommelingen in CPU en RAM
    serverState.cpu = Math.floor(15 + Math.random() * 20);
    serverState.ram = parseFloat((2.3 + Math.random() * 0.4).toFixed(1));
  } else {
    serverState.cpu = 0;
    serverState.ram = 0;
  }
}, 3000);

// API Endpoints

// Server status & stats ophalen
app.get('/api/server/status', (req, res) => {
  res.json(serverState);
});

// Server actie uitvoeren (start, stop, restart)
app.post('/api/server/action', (req, res) => {
  const { action } = req.body;
  const time = new Date().toLocaleTimeString();

  if (action === 'start') {
    serverState.status = 'online';
    logs.push({ timestamp: time, text: "Command received: START. Starting server..." });
    logs.push({ timestamp: time, text: "Server started successfully." });
  } else if (action === 'stop') {
    serverState.status = 'offline';
    logs.push({ timestamp: time, text: "Command received: STOP. Gracefully shutting down..." });
    logs.push({ timestamp: time, text: "Server stopped." });
  } else if (action === 'restart') {
    serverState.status = 'restarting';
    logs.push({ timestamp: time, text: "Command received: RESTART. Rebooting server..." });
    setTimeout(() => {
      serverState.status = 'online';
      logs.push({ timestamp: new Date().toLocaleTimeString(), text: "Server restart complete." });
    }, 4000);
  }

  res.json({ success: true, status: serverState.status });
});

// Logs ophalen
app.get('/api/server/logs', (req, res) => {
  res.json(logs);
});

// Commando uitvoeren via terminal
app.post('/api/server/command', (req, res) => {
  const { command } = req.body;
  const time = new Date().toLocaleTimeString();
  
  logs.push({ timestamp: time, text: `$ ${command}` });

  let responseText = `Command '${command}' executed.`;
  if (command.toLowerCase() === 'help') {
    responseText = "Available commands: help, status, clear, ping, restart";
  } else if (command.toLowerCase() === 'status') {
    responseText = `Current Status: ${serverState.status.toUpperCase()} | CPU: ${serverState.cpu}% | RAM: ${serverState.ram}GB`;
  } else if (command.toLowerCase() === 'ping') {
    responseText = "PONG! Response time: 12ms";
  }

  logs.push({ timestamp: time, text: responseText });
  res.json({ success: true, response: responseText });
});

// Start de HTTP-server
app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`🚀 Freddo Hosting Server is gestart!`);
  console.log(`🌐 Open in je browser: http://localhost:${PORT}`);
  console.log(`=========================================`);
});
