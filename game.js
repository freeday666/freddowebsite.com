const form = document.getElementById("panel");
const menu = document.getElementById("menu");
const errorBox = document.getElementById("error");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  errorBox.textContent = "";

  const apiKey = document.getElementById("apiKey").value.trim();
  const mapId = document.getElementById("mapId").value.trim();

  if (!apiKey || !mapId) {
    errorBox.textContent = "Vul zowel je API-sleutel als Map ID in.";
    return;
  }

  try {
    await startGame(apiKey, mapId);
    menu.style.display = "none";
    document.getElementById("info").style.display = "block";
  } catch (error) {
    console.error(error);
    errorBox.textContent =
      "Kaart laden mislukt. Controleer je sleutel, Map ID en Google Maps-instellingen.";
  }
});

async function startGame(apiKey, mapId) {
  // Voorkom dat het script per ongeluk twee keer wordt geladen.
  if (!window.google?.maps?.importLibrary) {
    await new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src =
        "https://maps.googleapis.com/maps/api/js?key=" +
        encodeURIComponent(apiKey) +
        "&v=beta&libraries=maps3d";
      script.async = true;
      script.onload = resolve;
      script.onerror = () => reject(new Error("Google Maps script kon niet laden."));
      document.head.appendChild(script);
    });
  }

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
    label: "🚚 ORANJESTAD RP"
  });
  map.appendChild(truck);

  const keys = {};
  window.addEventListener("keydown", (event) => {
    keys[event.key.toLowerCase()] = true;
    if (event.key.startsWith("Arrow")) event.preventDefault();
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

    if (forward) speed = Math.min(speed + 8 * dt, 25);
    else if (backward) speed = Math.max(speed - 8 * dt, -10);
    else speed *= Math.pow(0.94, dt * 60);

    if (Math.abs(speed) > 0.2) {
      const steering = (right ? 1 : 0) - (left ? 1 : 0);
      heading = (heading + steering * 65 * dt * Math.sign(speed) + 360) % 360;

      const radians = heading * Math.PI / 180;
      const metersPerLatDegree = 111320;
      const metersPerLngDegree =
        111320 * Math.cos(lat * Math.PI / 180);
      const distance = speed * dt;

      lat += Math.cos(radians) * distance / metersPerLatDegree;
      lng += Math.sin(radians) * distance / metersPerLngDegree;
    }

    const position = { lat, lng, altitude: 0 };
    truck.position = position;

    // De camera volgt de locatie en kijkt vanuit achter de truck.
    map.center = position;
    map.heading = heading;
    map.tilt = 65;
    map.range = 90;

    document.getElementById("speed").textContent =
      Math.round(Math.abs(speed) * 3.6);

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
}
