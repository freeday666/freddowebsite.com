
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
const players = {};

app.use(express.static("public"));

io.on("connection", (socket) => {
  players[socket.id] = {
    id: socket.id,
    name: "Speler",
    x: 0,
    z: 0,
    rotation: 0
  };

  socket.emit("currentPlayers", players);
  socket.broadcast.emit("newPlayer", players[socket.id]);

  socket.on("setName", (name) => {
    if (!players[socket.id]) return;
    players[socket.id].name = String(name).slice(0, 20);
    io.emit("playerMoved", players[socket.id]);
  });

  socket.on("move", (data) => {
    if (!players[socket.id]) return;

    players[socket.id].x = Number(data.x) || 0;
    players[socket.id].z = Number(data.z) || 0;
    players[socket.id].rotation = Number(data.rotation) || 0;

    socket.broadcast.emit("playerMoved", players[socket.id]);
  });

  socket.on("disconnect", () => {
    delete players[socket.id];
    io.emit("playerDisconnected", socket.id);
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log("Oranjestad Roleplay server draait op poort " + PORT);
});
