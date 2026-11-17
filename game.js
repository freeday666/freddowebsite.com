import * as THREE from "three";

const root = document.querySelector("#game");
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9ac7e2);
scene.fog = new THREE.Fog(0x9ac7e2, 35, 150);

const camera = new THREE.PerspectiveCamera(65, innerWidth / innerHeight, 0.1, 300);
camera.position.set(0, 6, 12);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
root.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xe8f5ff, 0x51613e, 2));

const sun = new THREE.DirectionalLight(0xfff0d5, 2.5);
sun.position.set(-10, 20, 10);
sun.castShadow = true;
scene.add(sun);

const material = color => new THREE.MeshStandardMaterial({ color });

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(400, 400),
  material(0x568b4c)
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.1;
ground.receiveShadow = true;
scene.add(ground);

const road = new THREE.Mesh(
  new THREE.PlaneGeometry(10, 300),
  material(0x383c3e)
);
road.rotation.x = -Math.PI / 2;
road.position.z = -110;
road.receiveShadow = true;
scene.add(road);

// Middenstrepen.
const stripes = [];
for (let i = 0; i < 30; i++) {
  const stripe = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.04, 3),
    material(0xffffff)
  );
  stripe.position.set(0, 0.03, 8 - i * 10);
  scene.add(stripe);
  stripes.push(stripe);
}

// Truckcabine en trailer.
const truck = new THREE.Group();

const trailer = new THREE.Mesh(
  new THREE.BoxGeometry(2.5, 2.7, 6),
  material(0xd7dce0)
);
trailer.position.set(0, 2, 1.8);
trailer.castShadow = true;
truck.add(trailer);

const cab = new THREE.Mesh(
  new THREE.BoxGeometry(2.35, 2.2, 2),
  material(0x245c86)
);
cab.position.set(0, 1.8, -2.5);
cab.castShadow = true;
truck.add(cab);

const windshield = new THREE.Mesh(
  new THREE.BoxGeometry(1.8, 0.9, 0.05),
  new THREE.MeshStandardMaterial({
    color: 0x9dd8ed,
    roughness: 0.25,
    metalness: 0.1
  })
);
windshield.position.set(0, 2.2, -3.52);
truck.add(windshield);

const wheelMaterial = material(0x17191b);
const wheelGeometry = new THREE.CylinderGeometry(0.45, 0.45, 0.3, 16);

for (const x of [-1.35, 1.35]) {
  for (const z of [-3, -1.3, 1, 3]) {
    const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, 0.48, z);
    wheel.castShadow = true;
    truck.add(wheel);
  }
}

truck.position.set(0, 0, 4);
scene.add(truck);

// Bomen langs de weg.
const trees = [];
for (let i = 0; i < 36; i++) {
  const tree = new THREE.Group();

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.25, 1.4, 7),
    material(0x68442b)
  );
  trunk.position.y = 0.7;
  tree.add(trunk);

  const crown = new THREE.Mesh(
    new THREE.ConeGeometry(1.2, 2.8, 8),
    material(0x246738)
  );
  crown.position.y = 2.5;
  crown.castShadow = true;
  tree.add(crown);

  tree.position.set(i % 2 ? -8 : 8, 0, 10 - i * 11);
  scene.add(tree);
  trees.push(tree);
}

const input = { left: false, right: false, accelerate: false, brake: false };
let running = false;
let speed = 0;
let distance = 0;
let missionDone = false;
let lastTime = performance.now();

function startGame() {
  running = true;
  speed = 0;
  distance = 0;
  missionDone = false;
  truck.position.x = 0;
  document.querySelector("#mission").textContent = "Missie: lever de vracht af";
  document.querySelector("#overlay").hidden = true;
}
window.startTruckGame = startGame;

document.querySelector("#start").addEventListener("click", startGame);

function bindButton(button) {
  const key = button.dataset.key;
  const set = value => { input[key] = value; };

  button.addEventListener("pointerdown", event => {
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    set(true);
  });
  for (const name of ["pointerup", "pointercancel", "lostpointercapture"]) {
    button.addEventListener(name, () => set(false));
  }
}
document.querySelectorAll("#controls button").forEach(bindButton);

function handleKey(event, value) {
  const key = event.key.toLowerCase();
  if (key === "a" || key === "arrowleft") input.left = value;
  if (key === "d" || key === "arrowright") input.right = value;
  if (key === "w" || key === "arrowup") input.accelerate = value;
  if (key === "s" || key === "arrowdown") input.brake = value;
  if (key.startsWith("arrow")) event.preventDefault();
}
addEventListener("keydown", e => handleKey(e, true));
addEventListener("keyup", e => handleKey(e, false));
addEventListener("blur", () => {
  for (const key in input) input[key] = false;
});

function showDelivery() {
  if (missionDone || distance < 500) return;
  missionDone = true;
  running = false;
  document.querySelector("#mission").textContent = "Missie voltooid! +€500";
  document.querySelector("#overlay-title").textContent = "Afgeleverd!";
  document.querySelector("#overlay-text").textContent =
    "Goed gedaan! Je hebt de vracht afgeleverd en €500 verdiend.";
  document.querySelector("#start").textContent = "Nieuwe rit";
  document.querySelector("#overlay").hidden = false;
}

function animate(now) {
  requestAnimationFrame(animate);
  const dt = Math.min((now - lastTime) / 1000, 0.04);
  lastTime = now;

  if (running) {
    if (input.accelerate) speed = Math.min(speed + 35 * dt, 110);
    else speed = Math.max(speed - 7 * dt, 0);
    if (input.brake) speed = Math.max(speed - 65 * dt, 0);

    const steering = Number(input.right) - Number(input.left);
    truck.position.x = THREE.MathUtils.clamp(
      truck.position.x + steering * dt * (2 + speed * 0.025),
      -3.5,
      3.5
    );
    truck.rotation.z = -steering * 0.035;

    const worldSpeed = speed / 3.6;
    distance += worldSpeed * dt;

    for (const stripe of stripes) {
      stripe.position.z += worldSpeed * dt;
      if (stripe.position.z > 12) stripe.position.z -= 300;
    }

    for (const tree of trees) {
      tree.position.z += worldSpeed * dt;
      if (tree.position.z > 18) tree.position.z -= 396;
    }

    document.querySelector("#speed").textContent = Math.round(speed);
    document.querySelector("#distance").textContent = Math.floor(distance);
    showDelivery();
  }

  camera.position.x += (truck.position.x * 0.35 - camera.position.x) * 0.06;
  camera.lookAt(truck.position.x * 0.2, 1.5, -12);
  renderer.render(scene, camera);
}

requestAnimationFrame(animate);

addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
