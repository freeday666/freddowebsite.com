import * as THREE from "three";

const root = document.querySelector("#game");
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9ac7e2);
scene.fog = new THREE.Fog(0x9ac7e2, 100, 900);

const camera = new THREE.PerspectiveCamera(65, innerWidth / innerHeight, 0.1, 2000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
root.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xe8f5ff, 0x526443, 2));

const sun = new THREE.DirectionalLight(0xfff0d5, 2.4);
sun.position.set(-80, 160, 100);
sun.castShadow = true;
scene.add(sun);

const mat = color => new THREE.MeshStandardMaterial({ color });

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(4000, 4000),
  mat(0x66894f)
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.2;
ground.receiveShadow = true;
scene.add(ground);

// Route wordt omgezet van GPS-coördinaten naar lokale 3D-coördinaten.
let routePoints = [];
let routeCurve = null;
let routeLength = 0;
let progress = 0;
let speed = 0;
let running = false;
let routeLoaded = false;
let steering = 0;

const truck = new THREE.Group();
scene.add(truck);

// Trailer, cabine en voorruit.
const trailer = new THREE.Mesh(
  new THREE.BoxGeometry(2.6, 2.8, 7),
  mat(0xd7dce0)
);
trailer.position.set(0, 2.1, 1.6);
trailer.castShadow = true;
truck.add(trailer);

const cab = new THREE.Mesh(
  new THREE.BoxGeometry(2.4, 2.2, 2.3),
  mat(0x245c86)
);
cab.position.set(0, 1.8, -3.2);
cab.castShadow = true;
truck.add(cab);

const glass = new THREE.Mesh(
  new THREE.BoxGeometry(1.8, 0.9, 0.05),
  new THREE.MeshStandardMaterial({ color: 0x9dd8ed, roughness: 0.25 })
);
glass.position.set(0, 2.2, -4.36);
truck.add(glass);

for (const x of [-1.35, 1.35]) {
  for (const z of [-3.8, -1.6, 1.2, 3.7]) {
    const wheel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.48, 0.48, 0.32, 16),
      mat(0x17191b)
    );
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, 0.5, z);
    wheel.castShadow = true;
    truck.add(wheel);
  }
}

function makeRoad(points) {
  // Gooi de oude weg en decoratietakken weg als er een nieuwe route komt.
  for (const object of [...scene.children]) {
    if (object.userData.routeObject) scene.remove(object);
  }

  const vectors = points.map(p => new THREE.Vector3(p.x, 0, p.y));
  routeCurve = new THREE.CatmullRomCurve3(vectors);
  routeLength = routeCurve.getLength();
  progress = 0;

  // Wegdek volgt de GPS-route.
  const samples = Math.max(250, Math.ceil(routeLength / 2));
  const roadPoints = routeCurve.getPoints(samples);
  const vertices = [];
  const indices = [];

  for (let i = 0; i < roadPoints.length; i++) {
    const p = roadPoints[i];
    const tangent = routeCurve.getTangentAt(i / samples).normalize();
    const side = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

    const left = p.clone().addScaledVector(side, 5);
    const right = p.clone().addScaledVector(side, -5);
    vertices.push(left.x, 0.02, left.z, right.x, 0.02, right.z);

    if (i < roadPoints.length - 1) {
      const a = i * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }

  const roadGeometry = new THREE.BufferGeometry();
  roadGeometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  roadGeometry.setIndex(indices);
  roadGeometry.computeVertexNormals();

  const road = new THREE.Mesh(
    roadGeometry,
    new THREE.MeshStandardMaterial({
      color: 0x383c3e,
      side: THREE.DoubleSide,
      roughness: 0.95
    })
  );
  road.userData.routeObject = true;
  road.receiveShadow = true;
  scene.add(road);

  // Wegmarkeringen.
  const linePoints = [];
  for (let i = 0; i <= samples; i += 5) {
    const p = roadPoints[i];
    linePoints.push(new THREE.Vector3(p.x, 0.06, p.z));
  }
  const centerLine = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(linePoints),
    new THREE.LineBasicMaterial({ color: 0xf5f0d8 })
  );
  centerLine.userData.routeObject = true;
  scene.add(centerLine);

  addRoadsideScenery(roadPoints);
  placeTruck();
}

function addRoadsideScenery(points) {
  const treeMaterial = mat(0x286338);
  const trunkMaterial = mat(0x68442b);
  const buildingMaterial = mat(0xc6b99d);

  for (let i = 12; i < points.length; i += 28) {
    const p = points[i];
    const tangent = routeCurve.getTangentAt(i / (points.length - 1)).normalize();
    const side = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

    for (const sign of [-1, 1]) {
      const position = p.clone().addScaledVector(side, sign * (10 + Math.random() * 8));

      if (Math.random() < 0.68) {
        const tree = new THREE.Group();
        const trunk = new THREE.Mesh(
          new THREE.CylinderGeometry(0.2, 0.3, 1.5, 7),
          trunkMaterial
        );
        trunk.position.y = 0.75;
        tree.add(trunk);

        const crown = new THREE.Mesh(
          new THREE.ConeGeometry(1.2, 3, 8),
          treeMaterial
        );
        crown.position.y = 2.8;
        crown.castShadow = true;
        tree.add(crown);
        tree.position.set(position.x, 0, position.z);
        tree.userData.routeObject = true;
        scene.add(tree);
      } else {
        const building = new THREE.Mesh(
          new THREE.BoxGeometry(5 + Math.random() * 6, 4 + Math.random() * 9, 5),
          buildingMaterial
        );
        building.position.set(position.x, building.geometry.parameters.height / 2, position.z);
        building.userData.routeObject = true;
        building.castShadow = true;
        scene.add(building);
      }
    }
  }
}

// GPS-punten projecteren op een lokaal vlak.
// Voor routes in één regio is deze benadering geschikt.
function gpsToLocal(points) {
  const origin = points[0];
  const metersPerDegreeLat = 111320;
  const metersPerDegreeLng = 111320 * Math.cos(origin.lat * Math.PI / 180);

  return points.map(p => ({
    x: (p.lng - origin.lng) * metersPerDegreeLng,
    y: -(p.lat - origin.lat) * metersPerDegreeLat
  }));
}

window.addEventListener("truck-route-ready", event => {
  const local = gpsToLocal(event.detail.points);
  makeRoad(local);
  routeLoaded = true;

  document.querySelector("#mission").textContent =
    "Missie: volg de echte route naar Utrecht";
  document.querySelector("#overlay-text").textContent =
    "De echte route is geladen. Druk op Start missie en rijd naar de bestemming.";
  document.querySelector("#start").disabled = false;
});

function placeTruck() {
  if (!routeCurve) return;

  const t = Math.min(progress / routeLength, 1);
  const point = routeCurve.getPointAt(t);
  const tangent = routeCurve.getTangentAt(t).normalize();

  // Truck kijkt vooruit langs de route.
  truck.position.set(point.x, 0, point.z);
  truck.rotation.y = Math.atan2(-tangent.x, -tangent.z);

  // Stuurbeweging is klein en tijdelijk; truck blijft op de route.
  truck.position.x += steering * 0.4;
}

function startGame() {
  if (!routeLoaded) {
    document.querySelector("#map-status").textContent =
      "Wacht tot Google Maps de route heeft geladen.";
    return;
  }

  if (progress >= routeLength) progress = 0;
  running = true;
  document.querySelector("#overlay").hidden = true;
  document.querySelector("#mission").textContent =
    "Missie: lever de vracht af";
}
window.startTruckGame = startGame;
document.querySelector("#start").addEventListener("click", startGame);

const input = { left: false, right: false, accelerate: false, brake: false };

function setInput(key, value) {
  input[key] = value;
}

document.querySelectorAll("#controls button").forEach(button => {
  const key = button.dataset.key;
  if (!key) return;

  button.addEventListener("pointerdown", e => {
    e.preventDefault();
    button.setPointerCapture(e.pointerId);
    setInput(key, true);
  });
  for (const name of ["pointerup", "pointercancel", "lostpointercapture"]) {
    button.addEventListener(name, () => setInput(key, false));
  }
});

addEventListener("keydown", e => {
  const key = e.key.toLowerCase();
  if (key === "w" || key === "arrowup") setInput("accelerate", true);
  if (key === "s" || key === "arrowdown") setInput("brake", true);
  if (key === "a" || key === "arrowleft") setInput("left", true);
  if (key === "d" || key === "arrowright") setInput("right", true);
});

addEventListener("keyup", e => {
  const key = e.key.toLowerCase();
  if (key === "w" || key === "arrowup") setInput("accelerate", false);
  if (key === "s" || key === "arrowdown") setInput("brake", false);
  if (key === "a" || key === "arrowleft") setInput("left", false);
  if (key === "d" || key === "arrowright") setInput("right", false);
});

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(renderer.info?.render?.frame ? 1 / 60 : 1 / 60, 0.04);

  if (running && routeCurve) {
    if (input.accelerate) speed = Math.min(speed + 18 * dt, 30);
    else speed = Math.max(0, speed - 3 * dt);
    if (input.brake) speed = Math.max(0, speed - 24 * dt);

    steering = Number(input.right) - Number(input.left);
    progress += speed * dt;

    if (progress >= routeLength) {
      progress = routeLength;
      running = false;
      speed = 0;
      document.querySelector("#mission").textContent = "Missie voltooid! +€500";
      document.querySelector("#overlay-title").textContent = "Afgeleverd!";
      document.querySelector("#overlay-text").textContent =
        "Je bent aangekomen op de bestemming. Goed gereden!";
      document.querySelector("#start").textContent = "Rijd opnieuw";
      document.querySelector("#overlay").hidden = false;
    }

    placeTruck();
    document.querySelector("#speed").textContent = Math.round(speed * 3.6);
    document.querySelector("#distance").textContent =
      Math.floor(routeLength - progress);
  }

  if (routeCurve) {
    const behind = new THREE.Vector3(0, 6, 12);
    behind.applyAxisAngle(new THREE.Vector3(0, 1, 0), truck.rotation.y);
    const target = truck.position.clone().add(behind);
    camera.position.lerp(target, 0.08);
    camera.lookAt(truck.position.x, 1.5, truck.position.z - 8);
  } else {
    camera.position.set(0, 30, 50);
    camera.lookAt(0, 0, 0);
  }

  renderer.render(scene, camera);
}

document.querySelector("#start").disabled = true;
animate();

addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
