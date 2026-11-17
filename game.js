const form = document.getElementById("panel");
const menu = document.getElementById("menu");
const errorBox = document.getElementById("error");
const startButton = document.getElementById("startButton");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  errorBox.textContent = "";

  const apiKey = document.getElementById("apiKey").value.trim();
  const mapId = document.getElementById("mapId").value.trim();

  if (!apiKey || !mapId) {
    errorBox.textContent = "Vul zowel je API-sleutel als Map ID in.";
    return;
  }

  startButton.disabled = true;
  startButton.textContent = "Kaart laden…";

  try {
    await loadGoogleMaps(apiKey);
    await startGame(mapId);

    menu.style.display = "none";
    document.getElementById("info").style.display = "block";
  } catch (error) {
    console.error(error);
    errorBox.textContent =
      "Kaart laden mislukt. Controleer je API-sleutel, Map ID, API-instellingen en facturering.";
    startButton.disabled = false;
    startButton.textContent = "Start game";
  }
});

function loadGoogleMaps(apiKey) {
  if (window.google?.maps?.importLibrary) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src =
      "https://maps.googleapis.com/maps/api/js?key=" +
      encodeURIComponent(apiKey) +
      "&v=beta&libraries=maps3d";
    script.async = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error("Google Maps-script kon niet laden."));
    document.head.appendChild(script);
  });
}

async function startGame(mapId) {
  const { Map3DElement, Marker3DElement } =
    await google.maps.importLibrary("maps3d");

  // Startlocatie: Oranjestad, Aruba.
  let lat = 12.5092;
  let lng = -70.0086;
  let heading = 0;
  let speed = 0;
  let previousTime = performance.now();

  const map = new Map3DElement({
    center: { lat, lng, altitude: 0 },
    range: 90,
    tilt: 65,
    heading,
    mapId
  });

  document.body.appendChild(map);

  const truck = new Marker3DElement({
    position: { lat, lng, altitude: 0 },
    label: "ORANJESTAD RP"
  });

  map.appendChild(truck);

  const keys = Object.create(null);

  window.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    keys[key] = true;

    if (key.startsWith("arrow")) {
      event.preventDefault();
    }
  });

  window.addEventListener("keyup", (event) => {
    keys[event.key.toLowerCase()] = false;
  });

  function animate(now) {
    const dt = Math.min((now - previousTime) / 1000, 0.05);
    previousTime = now;

    const forward = keys.w || keys.arrowup;
    const backward = keys.s || keys.arrowdown;
    const left = keys.a || keys.arrowleft;
    const right = keys.d || keys.arrowright;

    if (forward) {
      speed = Math.min(speed + 8 * dt, 25);
    } else if (backward) {
      speed = Math.max(speed - 8 * dt, -10);
    } else {
      speed *= Math.pow(0.94, dt * 60);
    }

    if (Math.abs(speed) > 0.2) {
      const steering = Number(right) - Number(left);
      heading = (heading + steering * 65 * dt * Math.sign(speed) + 360) % 360;

      const radians = heading * Math.PI / 180;
      const metersPerLatitudeDegree = 111320;
      const metersPerLongitudeDegree =
        111320 * Math.cos(lat * Math.PI / 180);
      const distance = speed * dt;

      lat += Math.cos(radians) * distance / metersPerLatitudeDegree;
      lng += Math.sin(radians) * distance / metersPerLongitudeDegree;
    }

    const position = { lat, lng, altitude: 0 };

    truck.position = position;
    map.center = position;
    map.heading = heading;
    map.tilt = 65;
    map.range = 90;

    document.getElementById("speed").textContent =
      String(Math.round(Math.abs(speed) * 3.6));

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
}
