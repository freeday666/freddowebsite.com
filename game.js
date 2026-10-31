
const socket = io();

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x79c9ed);
scene.fog = new THREE.Fog(0x79c9ed, 35, 110);

const camera = new THREE.PerspectiveCamera(
  65,
  window.innerWidth / window.innerHeight,
  0.1,
  200
);

const renderer = new THREE.WebGLRenderer({
  antialias: true
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xffffff, 0x887755, 2));

const sunlight = new THREE.DirectionalLight(0xffffff, 2);
sunlight.position.set(20, 35, 15);
scene.add(sunlight);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(180, 180),
  new THREE.MeshStandardMaterial({ color: 0xd7bd8a })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.05;
scene.add(ground);

function box(x, y, z, sx, sy, sz, color) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(sx, sy, sz),
    new THREE.MeshStandardMaterial({ color })
  );

  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

// Wegen
box(0, 0.01, 0, 9, 0.08, 150, 0x555555);
box(0, 0.02, 0, 150, 0.08, 9, 0x555555);

// Wegmarkeringen
for (let i = -65; i < 70; i += 12) {
  box(0, 0.07, i, 0.18, 0.02, 5, 0xffffff);
  box(i, 0.07, 0, 5, 0.02, 0.18, 0xffffff);
}

// Kleurrijke gebouwen
const colors = [
  0xffd166, 0xff8c69, 0xf4f1de,
  0x9ad1d4, 0xf7c6c7, 0xe9c46a
];

for (let i = 0; i < 42; i++) {
  const x = (Math.random() - 0.5) * 110;
  const z = (Math.random() - 0.5) * 110;

  if (Math.abs(x) < 9 || Math.abs(z) < 9) continue;

  const w = 5 + Math.random() * 5;
  const h = 4 + Math.random() * 7;
  const d = 5 + Math.random() * 5;

  box(x, h / 2, z, w, h, d,
    colors[i % colors.length]);

  box(x, h + 0.15, z, w + 0.4, 0.3, d + 0.4,
    0xffffff);

  // Deuren
  box(x, 1, z + d / 2 + 0.03, 1.2, 2, 0.12, 0x754c24);
}

// Palmbomen
function palm(x, z) {
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.28, 4, 7),
    new THREE.MeshStandardMaterial({ color: 0x87542b })
  );

  trunk.position.set(x, 2, z);
  scene.add(trunk);

  for (let i = 0; i < 6; i++) {
    const leaf = new THREE.Mesh(
      new THREE.ConeGeometry(0.5, 4, 5),
      new THREE.MeshStandardMaterial({ color: 0x26834a })
    );

    leaf.position.set(x, 4.4, z);
    leaf.rotation.z = Math.PI / 2;
    leaf.rotation.y = i * Math.PI / 3;
    scene.add(leaf);
  }
}

for (let i = 0; i < 18; i++) {
  palm(-18 + i * 2, 13);
  palm(18 - i * 2, -13);
}

// Strand en zee
box(0, -0.2, -78, 180, 0.2, 25, 0x36b8d9);

// Speler
function createPlayer(color = 0x2266cc) {
  const group = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 1.2, 0.5),
    new THREE.MeshStandardMaterial({ color })
  );
  body.position.y = 1.1;
  group.add(body);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.35, 12, 12),
    new THREE.MeshStandardMaterial({ color: 0xe5b18c })
  );
  head.position.y = 2;
  group.add(head);

  scene.add(group);
  return group;
}

const player = createPlayer();
const remotePlayers = {};

let car = null;
let driving = false;
let rotation = 0;

function createCar() {
  const group = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 0.8, 4),
    new THREE.MeshStandardMaterial({ color: 0xeeeeee })
  );

  body.position.y = 0.8;
  group.add(body);

  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(1.7, 0.8, 1.9),
    new THREE.MeshStandardMaterial({ color: 0x77bde0 })
  );

  cabin.position.set(0, 1.5, -0.2);
  group.add(cabin);

  for (const x of [-1, 1]) {
    for (const z of [-1.3, 1.3]) {
      const wheel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.4, 0.25, 12),
        new THREE.MeshStandardMaterial({ color: 0x222222 })
      );

      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, 0.4, z);
      group.add(wheel);
    }
  }

  scene.add(group);
  return group;
}

car = createCar();
car.position.set(4, 0, 4);

let moveX = 0;
let moveZ = 0;

const joystick = document.getElementById("joystick");
const stick = document.getElementById("stick");

function updateJoystick(event) {
  const rect = joystick.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  let dx = event.clientX - cx;
  let dy = event.clientY - cy;

  const max = 35;
  const length = Math.hypot(dx, dy);

  if (length > max) {
    dx *= max / length;
    dy *= max / length;
  }

  moveX = dx / max;
  moveZ = dy / max;

  stick.style.transform = `translate(${dx}px, ${dy}px)`;
}

joystick.addEventListener("pointerdown", e => {
  joystick.setPointerCapture(e.pointerId);
  updateJoystick(e);
});

joystick.addEventListener("pointermove", e => {
  if (e.buttons) updateJoystick(e);
});

function resetJoystick() {
  moveX = 0;
  moveZ = 0;
  stick.style.transform = "translate(0px, 0px)";
}

joystick.addEventListener("pointerup", resetJoystick);
joystick.addEventListener("pointercancel", resetJoystick);

const keys = {};

window.addEventListener("keydown", e => {
  keys[e.key.toLowerCase()] = true;
});

window.addEventListener("keyup", e => {
  keys[e.key.toLowerCase()] = false;
});

document.getElementById("carButton").onclick = () => {
  driving = true;
};

document.getElementById("exitButton").onclick = () => {
  driving = false;
};

document.getElementById("nameButton").onclick = () => {
  const name = prompt("Wat is je spelersnaam?");
  if (name) socket.emit("setName", name);
};

socket.on("connect", () => {
  document.getElementById("status").textContent = "Online";
});

socket.on("disconnect", () => {
  document.getElementById("status").textContent = "Verbinding verbroken";
});

socket.on("currentPlayers", players => {
  for (const id in players) {
    if (id !== socket.id) addRemotePlayer(players[id]);
  }
  updateCount();
});

socket.on("newPlayer", data => {
  addRemotePlayer(data);
  updateCount();
});

function addRemotePlayer(data) {
  if (remotePlayers[data.id]) return;

  const remote = createPlayer(0xdd5533);
  remote.position.set(data.x, 0, data.z);
  remotePlayers[data.id] = remote;
}

socket.on("playerMoved", data => {
  if (data.id === socket.id) return;

  if (!remotePlayers[data.id]) addRemotePlayer(data);

  const remote = remotePlayers[data.id];
  remote.position.set(data.x, 0, data.z);
  remote.rotation.y = data.rotation;
});

socket.on("playerDisconnected", id => {
  if (remotePlayers[id]) {
    scene.remove(remotePlayers[id]);
    delete remotePlayers[id];
  }
  updateCount();
});

function updateCount() {
  document.getElementById("playerCount").textContent =
    "Spelers: " + (Object.keys(remotePlayers).length + 1);
}

let lastSent = 0;

function animate(time) {
  requestAnimationFrame(animate);

  let x = moveX;
  let z = moveZ;

  if (keys.w || keys.arrowup) z -= 1;
  if (keys.s || keys.arrowdown) z += 1;
  if (keys.a || keys.arrowleft) x -= 1;
  if (keys.d || keys.arrowright) x += 1;

  const length = Math.hypot(x, z);
  if (length > 1) {
    x /= length;
    z /= length;
  }

  const speed = driving ? 0.22 : 0.09;

  if (Math.abs(x) + Math.abs(z) > 0.01) {
    rotation = Math.atan2(x, z);
    const target = driving ? car : player;

    target.position.x += x * speed;
    target.position.z += z * speed;
    target.rotation.y = rotation;

    if (!driving) {
      car.position.set(player.position.x + 3, 0, player.position.z + 2);
    }
  }

  if (driving) {
    player.position.copy(car.position);
  }

  const focus = driving ? car.position : player.position;

  camera.position.lerp(
    new THREE.Vector3(
      focus.x,
      focus.y + 8,
      focus.z + 12
    ),
    0.08
  );

  camera.lookAt(focus.x, focus.y + 1, focus.z);

  if (time - lastSent > 100) {
    socket.emit("move", {
      x: player.position.x,
      z: player.position.z,
      rotation
    });
    lastSent = time;
  }

  renderer.render(scene, camera);
}

document.getElementById("loading").style.display = "none";
animate(0);

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
