(() => {
  if (!window.THREE) {
    document.body.insertAdjacentHTML(
      "beforeend",
      "<p style='position:fixed;top:100px;color:red'>Three.js kon niet laden. Controleer je internetverbinding.</p>"
    );
    return;
  }

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);
  scene.fog = new THREE.Fog(0x87ceeb, 65, 180);

  const camera = new THREE.PerspectiveCamera(
    65,
    window.innerWidth / window.innerHeight,
    0.1,
    500
  );
  camera.position.set(0, 8, 14);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.appendChild(renderer.domElement);

  // Licht
  scene.add(new THREE.HemisphereLight(0xffffff, 0x68715d, 2));

  const zon = new THREE.DirectionalLight(0xffffff, 2.5);
  zon.position.set(-15, 25, 10);
  zon.castShadow = true;
  zon.shadow.mapSize.set(2048, 2048);
  scene.add(zon);

  // Materialen
  const groen = new THREE.MeshStandardMaterial({ color: 0x55a84f });
  const asfalt = new THREE.MeshStandardMaterial({ color: 0x33383d });
  const wit = new THREE.MeshStandardMaterial({ color: 0xf4f1e9 });
  const donker = new THREE.MeshStandardMaterial({ color: 0x232629 });
  const glas = new THREE.MeshStandardMaterial({
    color: 0x294554,
    metalness: 0.2,
    roughness: 0.2
  });
  const oranje = new THREE.MeshStandardMaterial({ color: 0xe66a13 });
  const metaal = new THREE.MeshStandardMaterial({
    color: 0x9ba4a8,
    metalness: 0.65,
    roughness: 0.35
  });

  function blok(parent, x, y, z, breedte, hoogte, lengte, materiaal) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(breedte, hoogte, lengte),
      materiaal
    );
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  // Vlakke groene wereld en weg
  const grond = new THREE.Mesh(new THREE.PlaneGeometry(500, 500), groen);
  grond.rotation.x = -Math.PI / 2;
  grond.position.y = -0.08;
  grond.receiveShadow = true;
  scene.add(grond);

  const weg = new THREE.Mesh(new THREE.PlaneGeometry(14, 400), asfalt);
  weg.rotation.x = -Math.PI / 2;
  weg.position.set(0, 0, -120);
  weg.receiveShadow = true;
  scene.add(weg);

  // Wegstrepen
  for (let z = 50; z > -330; z -= 12) {
    const streep = new THREE.Mesh(
      new THREE.PlaneGeometry(0.25, 5),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    streep.rotation.x = -Math.PI / 2;
    streep.position.set(0, 0.015, z);
    scene.add(streep);
  }

  // Bermranden en simpele palmbomen langs de weg
  for (let z = 45; z > -300; z -= 24) {
    for (const x of [-10, 10]) {
      const stam = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.28, 3.2, 8),
        new THREE.MeshStandardMaterial({ color: 0x79502e })
      );
      stam.position.set(x, 1.5, z);
      stam.castShadow = true;
      scene.add(stam);

      const bladeren = new THREE.Mesh(
        new THREE.SphereGeometry(1.35, 8, 6),
        new THREE.MeshStandardMaterial({ color: 0x24783b })
      );
      bladeren.scale.set(1.5, 0.55, 1);
      bladeren.position.set(x, 3.3, z);
      bladeren.castShadow = true;
      scene.add(bladeren);
    }
  }

  // Vrachtwagen: de voorkant wijst naar -Z
  const truck = new THREE.Group();
  scene.add(truck);

  // Oplegger
  blok(truck, 0, 2.45, 2.6, 2.9, 3.3, 8.6, wit);
  blok(truck, 0, 0.78, 2.6, 2.95, 0.14, 8.65, metaal);

  // Oranje strepen aan de opleggerzijkanten
  for (const x of [-1.46, 1.46]) {
    blok(truck, x, 1.10, 2.6, 0.025, 0.13, 8.4, oranje);
    blok(truck, x, 1.32, 2.6, 0.025, 0.055, 8.4, oranje);
  }

  function maakTekst(text, x, y, z, draaiY) {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 256;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = "bold 112px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#df5d0b";
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;

    const label = new THREE.Mesh(
      new THREE.PlaneGeometry(7.6, 1.9),
      new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide
      })
    );
    label.position.set(x, y, z);
    label.rotation.y = draaiY;
    truck.add(label);
  }

  maakTekst("ORANJESTAD RP", 1.475, 2.65, 2.6, Math.PI / 2);
  maakTekst("ORANJESTAD RP", -1.475, 2.65, 2.6, -Math.PI / 2);

  // Cabine
  blok(truck, 0, 1.55, -2.85, 2.65, 1.35, 2.3, wit);
  blok(truck, 0, 2.65, -2.3, 2.55, 1.25, 1.5, wit);

  // Ruiten
  blok(truck, 0, 2.69, -3.07, 2.15, 0.78, 0.04, glas);
  blok(truck, -1.333, 2.67, -2.35, 0.04, 0.72, 0.85, glas);
  blok(truck, 1.333, 2.67, -2.35, 0.04, 0.72, 0.85, glas);

  // Grille, bumper en lampen
  blok(truck, 0, 1.35, -4.02, 1.55, 0.58, 0.08, donker);
  blok(truck, 0, 0.78, -4.06, 2.55, 0.2, 0.18, metaal);
  blok(truck, 0, 0.98, -4.075, 1.9, 0.07, 0.025, oranje);

  const lampMateriaal = new THREE.MeshStandardMaterial({
    color: 0xfff2b0,
    emissive: 0xffcc55,
    emissiveIntensity: 0.5
  });
  blok(truck, -0.95, 1.15, -4.08, 0.35, 0.25, 0.06, lampMateriaal);
  blok(truck, 0.95, 1.15, -4.08, 0.35, 0.25, 0.06, lampMateriaal);

  // Wielen en naven
  const wielPosities = [
    [-1.45, 0.62, -2.8], [1.45, 0.62, -2.8],
    [-1.45, 0.62, 0.2],  [1.45, 0.62, 0.2],
    [-1.45, 0.62, 5.1],  [1.45, 0.62, 5.1],
    [-1.45, 0.62, 6.2],  [1.45, 0.62, 6.2]
  ];

  const wielen = [];
  const wielGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.32, 24);
  const naafGeo = new THREE.CylinderGeometry(0.23, 0.23, 0.34, 20);

  for (const [x, y, z] of wielPosities) {
    const wiel = new THREE.Mesh(wielGeo, donker);
    wiel.rotation.z = Math.PI / 2;
    wiel.position.set(x, y, z);
    wiel.castShadow = true;
    truck.add(wiel);
    wielen.push(wiel);

    const naaf = new THREE.Mesh(naafGeo, metaal);
    naaf.rotation.z = Math.PI / 2;
    naaf.position.set(x * 1.015, y, z);
    truck.add(naaf);
  }

  truck.position.set(0, 0, 0);

  // Besturing
  const toetsen = {};
  window.addEventListener("keydown", (event) => {
    toetsen[event.key.toLowerCase()] = true;

    if (
      ["arrowup", "arrowdown", "arrowleft", "arrowright", " "]
        .includes(event.key.toLowerCase())
    ) {
      event.preventDefault();
    }
  });

  window.addEventListener("keyup", (event) => {
    toetsen[event.key.toLowerCase()] = false;
  });

  let snelheid = 0;
  const snelheidTekst = document.getElementById("speed");
  const klok = new THREE.Clock();

  function animeren() {
    requestAnimationFrame(animeren);

    const delta = Math.min(klok.getDelta(), 0.05);
    const vooruit = toetsen.w || toetsen.arrowup;
    const achteruit = toetsen.s || toetsen.arrowdown;
    const links = toetsen.a || toetsen.arrowleft;
    const rechts = toetsen.d || toetsen.arrowright;

    if (vooruit) snelheid += 9 * delta;
    else if (achteruit) snelheid -= 7 * delta;
    else snelheid *= Math.pow(0.94, delta * 60);

    snelheid = THREE.MathUtils.clamp(snelheid, -8, 20);

    if (Math.abs(snelheid) > 0.15) {
      const stuur = (rechts ? 1 : 0) - (links ? 1 : 0);
      truck.rotation.y += stuur * delta * 0.75 * Math.sign(snelheid);
    }

    // Rijden in de richting waarin de voorkant wijst
    truck.position.x += Math.sin(truck.rotation.y) * snelheid * delta;
    truck.position.z -= Math.cos(truck.rotation.y) * snelheid * delta;

    // Houd de vrachtwagen in de buurt van de weg
    truck.position.x = THREE.MathUtils.clamp(truck.position.x, -5.2, 5.2);

    // Wielen laten rollen
    for (const wiel of wielen) {
      wiel.rotation.x += snelheid * delta * 1.5;
    }

    // Camera volgt de vrachtwagen
    const cameraDoel = new THREE.Vector3(
      truck.position.x,
      7,
      truck.position.z + 13
    );
    camera.position.lerp(cameraDoel, 1 - Math.pow(0.001, delta));
    camera.lookAt(truck.position.x, 1.5, truck.position.z - 3);

    snelheidTekst.textContent = Math.round(Math.abs(snelheid) * 5);

    renderer.render(scene, camera);
  }

  animeren();

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
})();
