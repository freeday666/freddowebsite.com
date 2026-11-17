(() => {
  "use strict";

  if (!window.THREE) {
    document.body.innerHTML =
      "Three.js kon niet laden. Controleer je internetverbinding en laad de pagina opnieuw.";
    return;
  }

  // Renderer en scène
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x9cc9df);
  scene.fog = new THREE.Fog(0x9cc9df, 65, 250);

  const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.1, 500);
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  document.body.insertBefore(renderer.domElement, document.body.firstChild);

  scene.add(new THREE.HemisphereLight(0xe5f3ff, 0x625340, 2));

  const sunlight = new THREE.DirectionalLight(0xffefcf, 2.8);
  sunlight.position.set(-25, 42, 30);
  sunlight.castShadow = true;
  sunlight.shadow.mapSize.set(2048, 2048);
  sunlight.shadow.camera.left = -90;
  sunlight.shadow.camera.right = 90;
  sunlight.shadow.camera.top = 90;
  sunlight.shadow.camera.bottom = -90;
  scene.add(sunlight);

  const makeMaterial = (color, roughness = 0.85) =>
    new THREE.MeshStandardMaterial({ color, roughness });

  const material = {
    road: makeMaterial(0x45494a),
    sidewalk: makeMaterial(0xb9b5a9),
    brick: makeMaterial(0x985e4c),
    brick2: makeMaterial(0xb57964),
    cream: makeMaterial(0xd6c7a7),
    roof: makeMaterial(0x484342),
    glass: new THREE.MeshStandardMaterial({
      color: 0x263f4b, roughness: 0.25, metalness: 0.15
    }),
    white: makeMaterial(0xe7e9e7),
    black: makeMaterial(0x202326),
    tire: makeMaterial(0x141618),
    yellow: makeMaterial(0xf4cc35),
    green: makeMaterial(0x4bc14e),
    red: makeMaterial(0xcf3430),
    metal: new THREE.MeshStandardMaterial({
      color: 0x9da4a5, metalness: 0.7, roughness: 0.32
    }),
    interior: makeMaterial(0x282d31),
    seat: makeMaterial(0x333a3d)
  };

  function addBox(parent, x, y, z, width, height, depth, mat, castShadow = true) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(width, height, depth),
      mat
    );
    mesh.position.set(x, y, z);
    mesh.castShadow = castShadow;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  function addCylinder(parent, x, y, z, radius, height, mat, segments = 16) {
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius, height, segments),
      mat
    );
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  }

  // Straat en stoepen
  addBox(scene, 0, -0.16, 0, 13, 0.3, 280, material.road, false);
  addBox(scene, -8.3, -0.06, 0, 3.6, 0.22, 280, material.sidewalk, false);
  addBox(scene, 8.3, -0.06, 0, 3.6, 0.22, 280, material.sidewalk, false);

  for (let z = -135; z < 140; z += 8) {
    addBox(scene, 0, 0.005, z, 0.12, 0.025, 3.2, material.white, false);
    addBox(scene, -6.48, 0.03, z, 0.11, 0.04, 7.7, material.white, false);
    addBox(scene, 6.48, 0.03, z, 0.11, 0.04, 7.7, material.white, false);
  }

  // Huizen
  function makeHouse(x, z, houseMaterial, side) {
    const house = new THREE.Group();
    house.position.set(x, 0, z);
    scene.add(house);

    addBox(house, 0, 4.2, 0, 7.1, 8.4, 8.2, houseMaterial);
    addBox(house, 0, 8.45, 0, 7.5, 0.25, 8.5, material.roof);

    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(5.8, 4.3, 4),
      material.roof
    );
    roof.position.set(0, 10.35, 0);
    roof.rotation.y = Math.PI / 4;
    roof.scale.z = 0.84;
    roof.castShadow = true;
    house.add(roof);

    const frontX = side < 0 ? 3.58 : -3.58;

    for (let floor = 0; floor < 2; floor++) {
      for (let row = 0; row < 2; row++) {
        const y = 2.3 + floor * 3.5;
        const windowZ = -2 + row * 3.7;
        const trimOffset = side < 0 ? 0.08 : -0.08;

        addBox(house, frontX, y, windowZ, 0.12, 1.65, 1.5, material.glass, false);
        addBox(house, frontX + trimOffset, y, windowZ, 0.16, 0.12, 1.65, material.white, false);
        addBox(house, frontX + trimOffset, y, windowZ, 0.16, 1.65, 0.12, material.white, false);
      }
    }

    addBox(house, frontX, 0.95, 0.8, 0.18, 2, 1.15, material.black);
  }

  const houseMaterials = [material.brick, material.brick2, material.cream];

  for (let z = -132, i = 0; z < 135; z += 10, i++) {
    makeHouse(-12.9, z, houseMaterials[i % 3], -1);
    makeHouse(12.9, z + 3, houseMaterials[(i + 1) % 3], 1);
  }

  // Straatlantaarns
  for (let z = -125; z < 135; z += 24) {
    for (const x of [-7.5, 7.5]) {
      addCylinder(scene, x, 2.7, z, 0.09, 5.4, material.black);
      addBox(scene, x, 5.4, z, 0.55, 0.15, 0.35, material.yellow);
    }
  }

  // Bestelwagen, neus wijst naar -Z
  const van = new THREE.Group();
  van.position.set(0, 0.08, 24);
  scene.add(van);

  const body = new THREE.Group();
  van.add(body);

  addBox(body, 0, 1.55, 0.05, 2.45, 1.45, 4.15, material.white);
  addBox(body, 0, 2.85, 1.0, 2.45, 2.6, 2.15, material.white);
  addBox(body, 0, 2.87, -0.13, 2.12, 1.7, 0.035, material.white);
  addBox(body, 0, 2.85, 2.1, 2.12, 2.2, 0.05, material.white);

  // Ruiten
  addBox(body, 0, 2.75, -1.9, 2.08, 1.1, 0.045, material.glass);
  addBox(body, -1.235, 2.72, -1.0, 0.04, 1.02, 1.35, material.glass);
  addBox(body, 1.235, 2.72, -1.0, 0.04, 1.02, 1.35, material.glass);
  addBox(body, 0, 1.93, -2.05, 2.4, 0.15, 0.35, material.black);

  // Achterdeuren
  const rearDoors = new THREE.Group();
  rearDoors.position.set(0, 2.83, 2.19);
  body.add(rearDoors);

  addBox(rearDoors, -0.53, 0, 0, 1.04, 2.22, 0.09, material.white);
  addBox(rearDoors, 0.53, 0, 0, 1.04, 2.22, 0.09, material.white);
  addBox(rearDoors, -0.53, 0, 0.055, 0.045, 1.9, 0.035, material.metal);
  addBox(rearDoors, 0.53, 0, 0.055, 0.045, 1.9, 0.035, material.metal);
  addBox(rearDoors, -0.13, -0.04, 0.09, 0.12, 0.3, 0.08, material.black);
  addBox(rearDoors, 0.13, -0.04, 0.09, 0.12, 0.3, 0.08, material.black);

  // Achterlichten en bumper
  for (const x of [-0.92, 0.92]) {
    addBox(body, x, 0.83, 2.17, 0.28, 0.55, 0.12, material.black);
    addBox(body, x, 0.94, 2.24, 0.21, 0.15, 0.04, material.red);
    addBox(body, x, 0.75, 2.24, 0.21, 0.13, 0.04, material.yellow);
  }
  addBox(body, 0, 0.48, 2.2, 2.55, 0.16, 0.2, material.metal);

  // Wielen
  const wheels = [];

  for (const x of [-1.12, 1.12]) {
    for (const z of [-1.35, 1.42]) {
      const wheel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.43, 0.43, 0.24, 20),
        material.tire
      );
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, 0.52, z);
      wheel.castShadow = true;
      van.add(wheel);
      wheels.push(wheel);

      const hub = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.2, 0.255, 16),
        material.metal
      );
      hub.rotation.z = Math.PI / 2;
      hub.position.copy(wheel.position);
      van.add(hub);
    }
  }

  // Cabine en dashboard
  const interior = new THREE.Group();
  van.add(interior);

  addBox(interior, 0, 1.73, -1.12, 2.15, 0.18, 1.15, material.interior);
  addBox(interior, -0.55, 1.32, -1.17, 0.72, 0.68, 0.72, material.seat);
  addBox(interior, 0.55, 1.32, -1.17, 0.72, 0.68, 0.72, material.seat);
  addBox(interior, 0, 2.02, -1.78, 2.15, 0.35, 0.52, material.interior);
  addBox(interior, -0.48, 2.24, -1.66, 0.56, 0.22, 0.035, material.black);
  addBox(interior, 0.55, 2.22, -1.65, 0.65, 0.14, 0.04, material.black);

  const steeringWheel = new THREE.Mesh(
    new THREE.TorusGeometry(0.23, 0.035, 8, 24),
    material.black
  );
  steeringWheel.position.set(-0.55, 2.14, -1.47);
  steeringWheel.rotation.x = Math.PI / 2;
  interior.add(steeringWheel);

  const cockpitCamera = new THREE.PerspectiveCamera(76, innerWidth / innerHeight, 0.04, 220);
  cockpitCamera.position.set(-0.48, 2.08, -1.42);
  van.add(cockpitCamera);

  // Speler wanneer uitgestapt
  const player = new THREE.Group();
  const person = new THREE.Group();
  player.add(person);

  const personBody = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.28, 0.72, 5, 10),
    makeMaterial(0x2865a8)
  );
  personBody.position.y = 0.77;
  personBody.castShadow = true;
  person.add(personBody);

  const personHead = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 14, 12),
    makeMaterial(0xd9ad85)
  );
  personHead.position.y = 1.45;
  person.add(personHead);
  scene.add(player);
  player.visible = false;

  // Bezorgbestemming
  const destination = new THREE.Group();
  destination.position.set(0, 0, -82);
  scene.add(destination);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(2.1, 0.15, 10, 40),
    new THREE.MeshStandardMaterial({
      color: 0x57ef49,
      emissive: 0x176d0d,
      emissiveIntensity: 0.7
    })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.14;
  destination.add(ring);

  const beacon = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.12, 4, 12),
    material.green
  );
  beacon.position.y = 2.1;
  destination.add(beacon);

  const markerTop = new THREE.Mesh(
    new THREE.SphereGeometry(0.38, 14, 12),
    material.green
  );
  markerTop.position.y = 4.25;
  destination.add(markerTop);

  // Interface en spelstatus
  const statusElement = document.getElementById("status");
  const promptElement = document.getElementById("prompt");
  const actionButton = document.getElementById("action");
  const missionText = document.getElementById("missionText");

  const keys = Object.create(null);
  const held = { left: false, right: false, throttle: false, brake: false };

  let driving = true;
  let speed = 0;
  let steering = 0;
  let tailOpen = false;
  let delivered = false;
  let cameraMode = "chase";
  let personYaw = Math.PI;
  let nearby = "";
  let touchStart = null;

  function toggleRearDoor() {
    if (nearby !== "door" || driving) return;
    tailOpen = !tailOpen;
    rearDoors.rotation.y = tailOpen ? Math.PI : 0;
  }

  function enterOrExit() {
    if (driving) {
      driving = false;
      player.visible = true;
      player.position.set(van.position.x + 2.4, 0, van.position.z + 0.5);
      personYaw = Math.PI / 2;
      cameraMode = "person";
      return;
    }

    if (player.position.distanceTo(van.position) < 5) {
      driving = true;
      player.visible = false;
      cameraMode = "chase";
    }
  }

  function onKeyDown(event) {
    const key = event.key.toLowerCase();
    keys[key] = true;

    if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)) {
      event.preventDefault();
    }

    if (key === "e") enterOrExit();
    if (key === "u") toggleRearDoor();
    if (key === "c" && driving) {
      cameraMode = cameraMode === "chase" ? "cockpit" : "chase";
    }
  }

  function onKeyUp(event) {
    keys[event.key.toLowerCase()] = false;
  }

  addEventListener("keydown", onKeyDown);
  addEventListener("keyup", onKeyUp);

  addEventListener("blur", () => {
    for (const key in keys) keys[key] = false;
    for (const control in held) held[control] = false;
  });

  // Mobiele knoppen
  document.querySelectorAll("[data-control]").forEach(button => {
    const control = button.dataset.control;

    const start = event => {
      event.preventDefault();
      held[control] = true;
      button.classList.add("active");
      if (button.setPointerCapture && event.pointerId !== undefined) {
        button.setPointerCapture(event.pointerId);
      }
    };

    const stop = event => {
      event.preventDefault();
      held[control] = false;
      button.classList.remove("active");
    };

    button.addEventListener("pointerdown", start);
    button.addEventListener("pointerup", stop);
    button.addEventListener("pointercancel", stop);
    button.addEventListener("lostpointercapture", stop);
  });

  actionButton.addEventListener("pointerdown", event => {
    event.preventDefault();

    if (nearby === "door") {
      toggleRearDoor();
    } else if (nearby === "van" && !driving) {
      enterOrExit();
    }
  });

  // Veeg op het scherm om te lopen
  renderer.domElement.addEventListener("pointerdown", event => {
    if (!driving) touchStart = { x: event.clientX, y: event.clientY };
  });

  renderer.domElement.addEventListener("pointerup", event => {
    if (driving || !touchStart) return;

    const dx = event.clientX - touchStart.x;
    const dy = event.clientY - touchStart.y;

    if (Math.abs(dx) + Math.abs(dy) > 20) {
      personYaw = Math.atan2(dx, -dy);
      const distance = Math.min(6, Math.hypot(dx, dy) * 0.025);
      player.position.x += Math.sin(personYaw) * distance;
      player.position.z -= Math.cos(personYaw) * distance;
    }

    touchStart = null;
  });

  function distanceXZ(a, b) {
    return Math.hypot(a.x - b.x, a.z - b.z);
  }

  function updateDriving(deltaTime) {
    const gas = held.throttle || keys.w || keys.arrowup;
    const brake = held.brake || keys.s || keys.arrowdown;
    const left = held.left || keys.a || keys.arrowleft;
    const right = held.right || keys.d || keys.arrowright;

    if (gas) speed += 8.5 * deltaTime;
    if (brake) speed -= 13 * deltaTime;
    if (!gas && !brake) speed *= Math.pow(0.985, deltaTime * 60);

    speed = THREE.MathUtils.clamp(speed, -5, 20);

    const targetSteering = (left ? 1 : 0) - (right ? 1 : 0);
    steering += (targetSteering - steering) * Math.min(1, deltaTime * 5);

    if (Math.abs(speed) > 0.15) {
      van.rotation.y += steering * deltaTime * 0.78 * Math.sign(speed);
    }

    const forwardX = -Math.sin(van.rotation.y);
    const forwardZ = -Math.cos(van.rotation.y);

    van.position.x += forwardX * speed * deltaTime;
    van.position.z += forwardZ * speed * deltaTime;
    van.position.x = THREE.MathUtils.clamp(van.position.x, -5.3, 5.3);
    van.position.z = THREE.MathUtils.clamp(van.position.z, -145, 145);

    for (const wheel of wheels) wheel.rotation.x += speed * deltaTime * 2;

    if (cameraMode === "chase") {
      const offset = new THREE.Vector3(
        Math.sin(van.rotation.y) * 8,
        4.4,
        Math.cos(van.rotation.y) * 8
      );

      const desiredPosition = van.position.clone().add(offset);
      camera.position.lerp(desiredPosition, 1 - Math.exp(-5 * deltaTime));
      camera.lookAt(van.position.x, van.position.y + 1.8, van.position.z);
    } else {
      camera.position.copy(cockpitCamera.getWorldPosition(new THREE.Vector3()));
      camera.quaternion.copy(cockpitCamera.getWorldQuaternion(new THREE.Quaternion()));
    }
  }

  function updateWalking(deltaTime) {
    const forward = (keys.w || keys.arrowup ? 1 : 0) - (keys.s || keys.arrowdown ? 1 : 0);
    const sideways = (keys.d || keys.arrowright ? 1 : 0) - (keys.a || keys.arrowleft ? 1 : 0);

    if (forward || sideways) {
      const length = Math.hypot(forward, sideways);
      const fx = Math.sin(personYaw);
      const fz = -Math.cos(personYaw);
      const rx = Math.cos(personYaw);
      const rz = Math.sin(personYaw);

      player.position.x += ((fx * forward + rx * sideways) / length) * 3.6 * deltaTime;
      player.position.z += ((fz * forward + rz * sideways) / length) * 3.6 * deltaTime;
      person.rotation.y = personYaw;
    }

    player.position.x = THREE.MathUtils.clamp(player.position.x, -10, 10);
    player.position.z = THREE.MathUtils.clamp(player.position.z, -145, 145);

    const targetPosition = new THREE.Vector3(player.position.x, player.position.y + 1.62, player.position.z);
    const targetRotation = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(0, personYaw, 0)
    );

    camera.position.lerp(targetPosition, 1 - Math.exp(-8 * deltaTime));
    camera.quaternion.slerp(targetRotation, 1 - Math.exp(-8 * deltaTime));
  }

  function updateInteraction() {
    const rearPosition = new THREE.Vector3(
      van.position.x,
      0,
      van.position.z + 3.2
    );

    const rearDistance = distanceXZ(player.position, rearPosition);
    const vanDistance = distanceXZ(player.position, van.position);

    nearby = "";

    if (!driving && rearDistance < 3.5) nearby = "door";
    else if (!driving && vanDistance < 4.5) nearby = "van";

    if (nearby === "door") {
      promptElement.style.display = "block";
      actionButton.style.display = "block";
      actionButton.textContent = tailOpen ? "SLUIT" : "KLEP";
      promptElement.textContent = tailOpen
        ? "Laadklep open — druk U of tik op SLUIT"
        : "Druk U of tik op KLEP om de achterklep te openen";
    } else if (nearby === "van") {
      promptElement.style.display = "block";
      actionButton.style.display = "block";
      actionButton.textContent = "IN";
      promptElement.textContent = "Druk E of tik op IN om in te stappen";
    } else {
      promptElement.style.display = "none";
      actionButton.style.display = "none";
    }

    const destinationDistance = distanceXZ(van.position, destination.position);

    if (!delivered && destinationDistance < 5) {
      delivered = true;
      missionText.textContent = "Bestemming bereikt — stap uit en open de laadklep";
      destination.visible = false;
    }

    if (delivered && tailOpen) {
      missionText.textContent = "Bezorging voltooid! Goed gedaan.";
    }
  }

  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);

    const deltaTime = Math.min(clock.getDelta(), 0.05);

    if (driving) {
      player.visible = false;
      updateDriving(deltaTime);
    } else {
      player.visible = true;
      updateWalking(deltaTime);
    }

    updateInteraction();

    statusElement.textContent =
      `${driving ? "🚚 In de bestelwagen" : "🚶 Te voet"} · ${Math.round(Math.abs(speed) * 3.6)} km/u`;

    ring.rotation.z += deltaTime * 0.6;
    renderer.render(scene, camera);
  }

  addEventListener("resize", () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();

    cockpitCamera.aspect = innerWidth / innerHeight;
    cockpitCamera.updateProjectionMatrix();

    renderer.setSize(innerWidth, innerHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  });

  animate();
})();
