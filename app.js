
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

// ROTTERDAM LIFE - 3D OPEN WORLD
// Voeg in index.html toe: <div id="game"></div>
// En: <script type="module" src="/app.js"></script>

const root = document.querySelector("#game") || document.body;
root.style.cssText = "position:fixed;inset:0;overflow:hidden;touch-action:none;background:#87b9d8";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x91c4e8);
scene.fog = new THREE.Fog(0x91c4e8, 100, 430);

const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
renderer.shadowMap.enabled = true;
root.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xffffff, 0x59634b, 2));

const sun = new THREE.DirectionalLight(0xfff1d8, 2.4);
sun.position.set(-80, 140, 65);
sun.castShadow = true;
scene.add(sun);

const material = color => new THREE.MeshStandardMaterial({ color, roughness: 0.7 });

const grass = material(0x66865a);
const asphalt = material(0x30343a);
const sidewalk = material(0xb6b4ad);
const glass = material(0x395d70);
const black = material(0x15191d);

function cube(parent, x, y, z, sx, sy, sz, mat) {
    const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(sx, sy, sz),
        mat
    );
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
}

// LAND
cube(scene, 0, -0.7, 0, 520, 1, 520, grass);

// ROADS
function makeRoad(x, z, width, depth) {
    cube(scene, x, -0.12, z, width, 0.22, depth, asphalt);
}

for (let i = -180; i <= 180; i += 60) {
    makeRoad(i, 0, 13, 420);
    makeRoad(0, i, 420, 13);
}

// BUILDINGS
const buildingColors = [
    0xc6b9a6,
    0x9dabb0,
    0xb58b70,
    0x777f85,
    0xd1c9b9
];

for (let x = -180; x <= 180; x += 60) {
    for (let z = -180; z <= 180; z += 60) {

        if (Math.abs(x) + Math.abs(z) < 100) continue;

        for (let n = 0; n < 3; n++) {
            const px = x + (n % 2 ? 12 : -12);
            const pz = z + (n === 2 ? 12 : -12);
            const height = 12 + Math.random() * 25;

            const building = new THREE.Group();
            building.position.set(px, 0, pz);
            scene.add(building);

            cube(
                building,
                0,
                height / 2,
                0,
                16,
                height,
                14,
                material(buildingColors[Math.floor(Math.random() * buildingColors.length)])
            );

            // WINDOWS
            for (let y = 3; y < height - 2; y += 3) {
                for (let wx = -5; wx <= 5; wx += 4) {
                    cube(building, wx, y, 7.08, 1.7, 1.6, 0.1, glass);
                }
            }

            // FRONT DOOR
            cube(building, 0, 1.2, 7.1, 2.2, 2.4, 0.1, black);
        }
    }
}

// PLAYER
const player = new THREE.Group();
scene.add(player);

cube(player, 0, 1, 0, 0.7, 1, 0.4, material(0x253d5a));

const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.25, 16, 12),
    material(0xc58c68)
);
head.position.y = 1.8;
player.add(head);

player.position.set(0, 0, 5);

// CARS
const cars = [];

function createCar(name, color, x, z) {
    const car = new THREE.Group();
    scene.add(car);
    car.position.set(x, 0.2, z);

    const paint = material(color);
    const windowMat = material(0x405e72);
    const tireMat = material(0x111111);

    // BODY
    cube(car, 0, 0.65, 0, 2.2, 0.65, 4.4, paint);

    // WINDOWS
    cube(car, 0, 1.15, -0.1, 1.8, 0.65, 2.3, windowMat);

    // WHEELS
    for (const side of [-1, 1]) {
        for (const zPos of [-1.45, 1.45]) {
            const wheel = new THREE.Mesh(
                new THREE.CylinderGeometry(0.42, 0.42, 0.25, 20),
                tireMat
            );

            wheel.rotation.z = Math.PI / 2;
            wheel.position.set(side * 1.1, 0.43, zPos);
            car.add(wheel);
        }
    }

    car.userData = {
        name,
        speed: 0,
        occupied: false
    };

    cars.push(car);
    return car;
}

// Fictional BMW/Tesla-inspired vehicles
createCar("BMW Sport", 0x263f69, 5, 12);
createCar("Tesla Electric", 0xc9cdd0, -7, 17);
createCar("Taxi", 0xd9b32e, 14, -12);
createCar("Police", 0x1e385e, -16, -12);

// PEDESTRIANS
const pedestrians = [];

for (let i = 0; i < 25; i++) {
    const npc = new THREE.Group();

    cube(npc, 0, 0.8, 0, 0.4, 0.8, 0.3,
        material(0x456b82));

    const npcHead = new THREE.Mesh(
        new THREE.SphereGeometry(0.17, 10, 8),
        material(0xc58c68)
    );

    npcHead.position.y = 1.4;
    npc.add(npcHead);

    npc.position.set(
        Math.random() * 100 - 50,
        0,
        Math.random() * 100 - 50
    );

    npc.userData.angle = Math.random() * Math.PI * 2;

    pedestrians.push(npc);
    scene.add(npc);
}

// SHOPS
const shops = [];

function createShop(name, x, z, color, job) {
    const shop = new THREE.Group();
    shop.position.set(x, 0, z);
    scene.add(shop);

    cube(shop, 0, 2, 0, 8, 4, 7, material(color));
    cube(shop, 0, 1.2, 3.6, 2, 2.4, 0.1, black);

    shops.push({ name, x, z, job });
}

createShop("Supermarkt", 24, 24, 0x9d8a70, "bezorger");
createShop("Taxi Centrale", -24, 24, 0xd2b34b, "taxi");
createShop("Garage", 24, -24, 0x657a8c, "monteur");
createShop("Pizzeria", -24, -24, 0xa66a52, "bezorger");

// HUD
const ui = document.createElement("div");

ui.style.cssText = `
position:absolute;
inset:0;
pointer-events:none;
color:white;
font: bold 15px Arial;
text-shadow:0 2px 4px black;
`;

ui.innerHTML = `
<div style="position:absolute;top:15px;left:15px;background:#111c;padding:12px;border-radius:10px">
ROTTERDAM LIFE<br>
Geld: €<span id="money">500</span><br>
Auto: <span id="status">Te voet</span><br>
<span id="mission">Zoek een baan</span>
</div>

<div style="position:absolute;top:15px;right:15px;pointer-events:auto">
<button id="camera">Camera</button>
<button id="enter">Instappen</button>
<button id="work">Werk</button>
</div>

<div id="joystick" style="
position:absolute;bottom:25px;left:20px;
width:120px;height:120px;border-radius:50%;
background:#ffffff44;border:2px solid white;
pointer-events:auto;touch-action:none">
<div id="stick" style="
width:40px;height:40px;background:white;
border-radius:50%;position:absolute;left:38px;top:38px">
</div>
</div>

<div style="position:absolute;right:20px;bottom:25px;pointer-events:auto">
<button id="gas">GAS</button>
<button id="brake">REM</button>
<button id="left">LINKS</button>
<button id="right">RECHTS</button>
</div>

<div id="message" style="
position:absolute;bottom:170px;left:50%;
transform:translateX(-50%);
background:#111c;padding:10px;border-radius:8px">
Welkom in Rotterdam!
</div>
`;

root.appendChild(ui);

const $ = id => document.getElementById(id);

let money = 500;
let currentCar = null;
let firstPerson = false;
let activeJob = false;
let joy = { x: 0, y: 0 };
let keys = {};

function message(text) {
    $("message").textContent = text;
}

function addMoney(amount) {
    money += amount;
    $("money").textContent = money;
}

// FIND NEAREST CAR
function nearestCar() {
    let nearest = null;
    let distance = 6;

    for (const car of cars) {
        const d = car.position.distanceTo(player.position);

        if (d < distance) {
            distance = d;
            nearest = car;
        }
    }

    return nearest;
}

// ENTER AND EXIT CAR
function enterExit() {
    if (currentCar) {
        player.position.copy(currentCar.position);
        player.position.x += 3;
        currentCar.userData.occupied = false;
        currentCar = null;

        $("status").textContent = "Te voet";
        message("Je bent uitgestapt!");
        return;
    }

    const car = nearestCar();

    if (!car) {
        message("Ga dichter bij een auto staan!");
        return;
    }

    currentCar = car;
    car.userData.occupied = true;
    $("status").textContent = car.userData.name;
    message("Je bent ingestapt!");
}

$("enter").onclick = enterExit;

$("camera").onclick = () => {
    firstPerson = !firstPerson;
    message(firstPerson ? "Eerste persoon" : "Derde persoon");
};

// JOB SYSTEM
$("work").onclick = () => {
    if (activeJob) {
        message("Maak eerst je opdracht af!");
        return;
    }

    activeJob = true;
    $("mission").textContent = "Opdracht: ga naar de supermarkt";
    message("Nieuwe bezorgopdracht! Ga naar de supermarkt.");
};

function checkJob() {
    if (!activeJob) return;

    const distance = player.position.distanceTo(
        new THREE.Vector3(24, 0, 24)
    );

    if (distance < 8) {
        activeJob = false;
        addMoney(150);
        $("mission").textContent = "Opdracht voltooid!";
        message("Goed gedaan! Je hebt €150 verdiend.");
    }
}

// MOBILE CONTROLS
function holdButton(id, key) {
    const button = $(id);

    button.addEventListener("pointerdown", e => {
        e.preventDefault();
        keys[key] = true;
        button.setPointerCapture(e.pointerId);
    });

    ["pointerup", "pointercancel", "lostpointercapture"].forEach(event => {
        button.addEventListener(event, () => keys[key] = false);
    });
}

holdButton("gas", "gas");
holdButton("brake", "brake");
holdButton("left", "left");
holdButton("right", "right");

const pad = $("joystick");
const stick = $("stick");

function moveJoystick(e) {
    const rect = pad.getBoundingClientRect();

    let x = (e.clientX - rect.left - rect.width / 2) / 48;
    let y = (e.clientY - rect.top - rect.height / 2) / 48;

    const length = Math.hypot(x, y) || 1;

    if (length > 1) {
        x /= length;
        y /= length;
    }

    joy = { x, y };

    stick.style.transform =
        `translate(${x * 35}px,${y * 35}px)`;
}

pad.addEventListener("pointerdown", e => {
    pad.setPointerCapture(e.pointerId);
    moveJoystick(e);
});

pad.addEventListener("pointermove", e => {
    if (e.buttons) moveJoystick(e);
});

pad.addEventListener("pointerup", () => {
    joy = { x: 0, y: 0 };
    stick.style.transform = "translate(0,0)";
});

window.addEventListener("keydown", e => {
    keys[e.key.toLowerCase()] = true;

    if (e.key.toLowerCase() === "e") enterExit();
    if (e.key.toLowerCase() === "c") firstPerson = !firstPerson;
    if (e.key.toLowerCase() === "j") $("work").click();
});

window.addEventListener("keyup", e => {
    keys[e.key.toLowerCase()] = false;
});

// GAME LOOP
const clock = new THREE.Clock();
const forward = new THREE.Vector3();
const desiredCamera = new THREE.Vector3();
const lookTarget = new THREE.Vector3();

function update(dt) {
    const turn =
        (keys.left ? -1 : 0) +
        (keys.right ? 1 : 0) +
        joy.x;

    if (currentCar) {
        const gas = keys.gas || joy.y < -0.25 ? 1 : 0;
        const brake = keys.brake || joy.y > 0.45 ? 1 : 0;

        currentCar.userData.speed += gas * 15 * dt;
        currentCar.userData.speed -= brake * 22 * dt;

        currentCar.userData.speed *= Math.pow(0.985, dt * 60);

        currentCar.userData.speed = THREE.MathUtils.clamp(
            currentCar.userData.speed,
            -9,
            26
        );

        currentCar.rotation.y += turn * dt;

        forward.set(
            Math.sin(currentCar.rotation.y),
            0,
            Math.cos(currentCar.rotation.y)
        );

        currentCar.position.addScaledVector(
            forward,
            currentCar.userData.speed * dt
        );

        player.position.copy(currentCar.position);

    } else {
        const x =
            (keys.d ? 1 : 0) -
            (keys.a ? 1 : 0) +
            joy.x;

        const z =
            (keys.s ? 1 : 0) -
            (keys.w ? 1 : 0) -
            joy.y;

        if (Math.hypot(x, z) > 0.1) {
            const angle = Math.atan2(x, z);

            player.rotation.y = angle;
            player.position.x += Math.sin(angle) * 5 * dt;
            player.position.z += Math.cos(angle) * 5 * dt;
        }
    }

    player.position.x = THREE.MathUtils.clamp(
        player.position.x, -205, 205
    );

    player.position.z = THREE.MathUtils.clamp(
        player.position.z, -205, 205
    );

    // NPC MOVEMENT
    for (const npc of pedestrians) {
        const angle = npc.userData.angle;

        npc.position.x += Math.sin(angle) * dt;
        npc.position.z += Math.cos(angle) * dt;

        if (Math.abs(npc.position.x) > 70 ||
            Math.abs(npc.position.z) > 70) {
            npc.userData.angle += Math.PI;
        }
    }

    checkJob();
}

// CAMERA SYSTEM
function updateCamera() {
    if (currentCar) {
        if (firstPerson) {
            desiredCamera.set(
                0, 1.6, 0
            ).applyMatrix4(currentCar.matrixWorld);

            camera.position.lerp(desiredCamera, 0.25);

            lookTarget.copy(currentCar.position);
            lookTarget.z += 15;
        } else {
            const offset = new THREE.Vector3(
                0, 5, -10
            ).applyAxisAngle(
                new THREE.Vector3(0, 1, 0),
                currentCar.rotation.y
            );

            desiredCamera.copy(currentCar.position).add(offset);
            camera.position.lerp(desiredCamera, 0.15);

            lookTarget.copy(currentCar.position);
        }
    } else {
        if (firstPerson) {
            desiredCamera.set(
                player.position.x,
                player.position.y + 1.65,
                player.position.z
            );

            camera.position.lerp(desiredCamera, 0.3);

            lookTarget.set(
                player.position.x,
                1.65,
                player.position.z + 12
            );
        } else {
            const offset = new THREE.Vector3(
                0, 5, -8
            ).applyAxisAngle(
                new THREE.Vector3(0, 1, 0),
                player.rotation.y
            );

            desiredCamera.copy(player.position).add(offset);
            camera.position.lerp(desiredCamera, 0.15);

            lookTarget.copy(player.position);
            lookTarget.y += 1;
        }
    }

    camera.lookAt(lookTarget);
}

// START
function animate() {
    requestAnimationFrame(animate);

    const dt = Math.min(clock.getDelta(), 0.04);

    update(dt);
    updateCamera();

    renderer.render(scene, camera);
}

animate();

window.addEventListener("resize", () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
});
